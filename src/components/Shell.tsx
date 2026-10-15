// Kerangka aplikasi: sidebar gelap 240px (>= 1024px) atau tab bawah 5 ikon (< 1024px).
import { useCallback, useState, type ReactNode } from 'react';
import {
  CalendarBlank, ChatsCircle, DotsThreeOutline, GearSix, GraduationCap, Kanban, SignOut, SquaresFour, UsersThree, WarningCircle,
  type Icon,
} from '@phosphor-icons/react';
import { normalKonfig, angka } from '../lib/format';
import { pindah, useJalur } from '../lib/rute';
import { useSesi } from '../lib/sesi';
import { useAksi } from '../lib/useAksi';
import type { RingkasanV2 } from '../lib/tipe';
import { LembarGeser } from './LembarGeser';
import { TitikAktif } from './TitikAktif';

interface Menu { jalur: string; label: string; ikon: Icon }

export const MENU: Menu[] = [
  { jalur: '/ikhtisar', label: 'Ikhtisar', ikon: SquaresFour },
  { jalur: '/pipeline', label: 'Pipeline', ikon: Kanban },
  { jalur: '/jadwal', label: 'Jadwal', ikon: CalendarBlank },
  { jalur: '/percakapan', label: 'Percakapan', ikon: ChatsCircle },
  { jalur: '/eskalasi', label: 'Eskalasi', ikon: WarningCircle },
  { jalur: '/klien', label: 'Klien', ikon: UsersThree },
  { jalur: '/latih', label: 'Latih', ikon: GraduationCap },
  { jalur: '/pengaturan', label: 'Pengaturan', ikon: GearSix },
];

const TAB_BAWAH = ['/ikhtisar', '/pipeline', '/percakapan', '/latih'];

function Tautan({ m, aktif, onPilih }: { m: Menu; aktif: boolean; onPilih?: () => void }) {
  const Ikon = m.ikon;
  return (
    <a
      href={m.jalur}
      aria-current={aktif ? 'page' : undefined}
      onClick={(e) => { e.preventDefault(); onPilih?.(); pindah(m.jalur); }}
      className={`flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors active:scale-[0.98] ${aktif ? 'bg-kuning-400 font-medium text-zinc-900' : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50'}`}
    >
      <Ikon size={20} />
      {m.label}
    </a>
  );
}

function PanelStatus({ gelap = true }: { gelap?: boolean }) {
  const { sesi } = useSesi();
  const konfig = useAksi<unknown>('konfigurasi_baca');
  const ring = useAksi<RingkasanV2>('ringkasan', { hari: 30 });
  const baris = normalKonfig(konfig.data);
  const aktif = baris.find((r) => r.kunci === 'BOT_AKTIF')?.nilai.toLowerCase() === 'ya';
  const model = baris.find((r) => r.kunci === 'MODEL_CHAT')?.nilai || '-';
  const teksRedup = gelap ? 'text-zinc-400' : 'text-zinc-500';
  return (
    <div className={`space-y-2 rounded-2xl p-3 text-[13px] ${gelap ? 'bg-zinc-800/70 text-zinc-200' : 'bg-zinc-100 text-zinc-800'}`}>
      <div className="flex items-center gap-2">
        <TitikAktif aktif={aktif && !konfig.memuat} />
        <span className="font-medium">{konfig.memuat ? 'Memeriksa bot' : konfig.galat ? 'Status tak terbaca' : aktif ? 'Bot aktif' : 'Bot nonaktif'}</span>
        {sesi.mock && <span className={`ml-auto rounded-md border border-dashed px-1.5 font-mono text-[11px] ${gelap ? 'border-zinc-600 text-zinc-400' : 'border-zinc-300 text-zinc-500'}`}>tiruan</span>}
      </div>
      <dl className={`grid grid-cols-[4.5rem_1fr] gap-y-1 font-mono text-[12px] ${teksRedup}`}>
        <dt>model</dt>
        <dd className="truncate">{model}</dd>
        <dt>kuota</dt>
        <dd>{typeof ring.data?.kuota_pct === 'number' ? `${angka(ring.data.kuota_pct, 1)}% token` : '-'}</dd>
      </dl>
    </div>
  );
}

function Pengguna({ gelap = true }: { gelap?: boolean }) {
  const { sesi, keluar } = useSesi();
  return (
    <div className="flex items-center gap-2 px-1">
      <span className={`min-w-0 flex-1 truncate text-[13px] ${gelap ? 'text-zinc-300' : 'text-zinc-700'}`}>
        {sesi.nama} <span className="font-mono text-[11px] text-zinc-500">{sesi.peran}</span>
      </span>
      <button type="button" onClick={keluar} aria-label="Keluar" title="Keluar" className={`inline-flex h-10 w-10 items-center justify-center rounded-xl active:scale-[0.98] ${gelap ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-100'}`}>
        <SignOut size={20} />
      </button>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const jalur = useJalur();
  const [lainnya, setLainnya] = useState(false);
  const tutup = useCallback(() => setLainnya(false), []);
  const tabLainAktif = !TAB_BAWAH.includes(jalur);

  return (
    <div className="min-h-[100dvh]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-zinc-900 px-4 pb-4 pt-5 lg:flex" aria-label="Navigasi">
        <div className="flex items-center gap-2 px-2 pb-6 font-medium text-zinc-50">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-kuning-400 font-mono text-sm font-semibold text-zinc-900">Y</span>
          CS YAMET
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {MENU.map((m) => <Tautan key={m.jalur} m={m} aktif={jalur === m.jalur || (m.jalur === '/klien' && jalur.startsWith('/klien/'))} />)}
        </nav>
        <div className="space-y-3">
          <PanelStatus />
          <Pengguna />
        </div>
      </aside>

      <div className="lg:pl-60">{children}</div>

      <nav aria-label="Navigasi" className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="grid h-16 grid-cols-5">
          {MENU.filter((m) => TAB_BAWAH.includes(m.jalur)).map((m) => {
            const Ikon = m.ikon;
            const aktif = jalur === m.jalur;
            return (
              <a key={m.jalur} href={m.jalur} aria-current={aktif ? 'page' : undefined} onClick={(e) => { e.preventDefault(); pindah(m.jalur); }} className="flex flex-col items-center justify-center gap-0.5 text-[11px] active:scale-[0.98]">
                <span className={`grid h-8 w-12 place-items-center rounded-full ${aktif ? 'bg-kuning-400 text-zinc-900' : 'text-zinc-500'}`}><Ikon size={20} /></span>
                <span className={aktif ? 'font-medium text-zinc-900' : 'text-zinc-500'}>{m.label}</span>
              </a>
            );
          })}
          <button type="button" onClick={() => setLainnya(true)} className="flex flex-col items-center justify-center gap-0.5 text-[11px] active:scale-[0.98]">
            <span className={`grid h-8 w-12 place-items-center rounded-full ${tabLainAktif ? 'bg-kuning-400 text-zinc-900' : 'text-zinc-500'}`}><DotsThreeOutline size={20} /></span>
            <span className={tabLainAktif ? 'font-medium text-zinc-900' : 'text-zinc-500'}>Lainnya</span>
          </button>
        </div>
      </nav>

      <LembarGeser terbuka={lainnya} onTutup={tutup} judul="Menu" kelasLayar="lg:hidden">
        <div className="space-y-4">
          <nav className="grid grid-cols-2 gap-2">
            {MENU.filter((m) => !TAB_BAWAH.includes(m.jalur)).map((m) => {
              const Ikon = m.ikon;
              const aktif = jalur === m.jalur;
              return (
                <a key={m.jalur} href={m.jalur} onClick={(e) => { e.preventDefault(); tutup(); pindah(m.jalur); }} className={`flex h-12 items-center gap-3 rounded-2xl border px-3 text-sm active:scale-[0.98] ${aktif ? 'border-kuning-400 bg-kuning-100 font-medium' : 'border-zinc-200'}`}>
                  <Ikon size={20} />
                  {m.label}
                </a>
              );
            })}
          </nav>
          <PanelStatus gelap={false} />
          <Pengguna gelap={false} />
        </div>
      </LembarGeser>
    </div>
  );
}
