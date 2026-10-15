import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowClockwise, Bell, GearSix, GraduationCap, Lightning, UserPlus, UsersThree, type Icon } from '@phosphor-icons/react';
import { PEGAS } from '../../lib/gerak';
import { sapaan } from '../../lib/format';
import { pindah } from '../../lib/rute';
import { useSesi } from '../../lib/sesi';
import type { Rentang } from '../../lib/tipe';
import { FormAksi, KOLOM_LEAD } from '../../components/FormAksi';
import { HeaderHalaman, PemilihRentang } from '../../components/HeaderHalaman';
import { PanelSamping } from '../../components/PanelSamping';
import { Tombol } from '../../components/Tombol';

function AksiCepat({ onTambahLead }: { onTambahLead: () => void }) {
  const [buka, setBuka] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!buka) return undefined;
    const klik = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setBuka(false);
    const tekan = (e: KeyboardEvent) => e.key === 'Escape' && setBuka(false);
    document.addEventListener('mousedown', klik);
    window.addEventListener('keydown', tekan);
    return () => {
      document.removeEventListener('mousedown', klik);
      window.removeEventListener('keydown', tekan);
    };
  }, [buka]);

  const item: [string, Icon, () => void][] = [
    ['Tambah lead manual', UserPlus, onTambahLead],
    ['Tambah klien aktif', UsersThree, () => pindah('/klien')],
    ['Ubah konfigurasi', GearSix, () => pindah('/pengaturan')],
    ['Buka halaman latih', GraduationCap, () => pindah('/latih')],
  ];
  return (
    <div ref={ref} className="relative">
      <Tombol varian="utama" ukuran="sedang" aria-expanded={buka} aria-haspopup="menu" onClick={() => setBuka((b) => !b)} ikon={<Lightning size={20} />}>
        Aksi cepat
      </Tombol>
      <AnimatePresence>
        {buka && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={PEGAS}
            className="absolute right-0 top-12 z-30 w-60 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-[0_20px_40px_-16px_rgba(39,39,42,0.25)]"
          >
            {item.map(([label, Ikon, f]) => (
              <button key={label} type="button" role="menuitem" onClick={() => { setBuka(false); f(); }} className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-zinc-800 hover:bg-zinc-100 active:scale-[0.98]">
                <Ikon size={20} className="text-zinc-500" />
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface KepalaProps {
  rentang: Rentang;
  onRentang: (r: Rentang) => void;
  onMuatUlang: () => void;
  eskalasiTerbuka: number | null;
}

export function KepalaIkhtisar({ rentang, onRentang, onMuatUlang, eskalasiTerbuka }: KepalaProps) {
  const { sesi } = useSesi();
  const [formLead, setFormLead] = useState(false);
  return (
    <>
      <HeaderHalaman judul={`${sapaan()}, ${sesi.nama}`} keterangan="Ini yang terjadi di YAMET hari ini.">
        <PemilihRentang nilai={rentang} onUbah={onRentang} />
        <Tombol ukuran="sedang" onClick={onMuatUlang} aria-label="Muat ulang" ikon={<ArrowClockwise size={20} />}>
          <span className="hidden sm:inline">Muat ulang</span>
        </Tombol>
        <a
          href="/eskalasi"
          onClick={(e) => { e.preventDefault(); pindah('/eskalasi'); }}
          aria-label={`Eskalasi terbuka: ${eskalasiTerbuka ?? 0}`}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 active:scale-[0.98]"
        >
          <Bell size={20} />
          {Boolean(eskalasiTerbuka) && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-bata-600 px-1 font-mono text-[11px] text-white">{eskalasiTerbuka}</span>
          )}
        </a>
        <AksiCepat onTambahLead={() => setFormLead(true)} />
      </HeaderHalaman>
      <PanelSamping terbuka={formLead} onTutup={() => setFormLead(false)} judul="Tambah lead manual">
        <FormAksi
          aksi="lead_tulis"
          kolom={KOLOM_LEAD}
          awal={{ nama_ortu: '', nomor: '', usia_anak: '', status: 'Baru', tanggal_observasi: '', keluhan: '', catatan_admin: '' }}
          label="Simpan lead"
          boleh={sesi.peran === 'admin'}
          pesanBerhasil="Lead tercatat (sumber manual)"
          kosongkanSetelah
        />
      </PanelSamping>
    </>
  );
}
