import { useState } from 'react';
import { motion } from 'framer-motion';
import { HARI_RENTANG } from '../lib/format';
import { INDUK_UBIN } from '../lib/gerak';
import { useAksi } from '../lib/useAksi';
import type { Rentang, RingkasanV2 } from '../lib/tipe';
import { IsiHalaman } from '../components/HeaderHalaman';
import { KepalaIkhtisar } from './ikhtisar/KepalaIkhtisar';
import { BarisMetrik } from './ikhtisar/BarisMetrik';
import { BarisDua } from './ikhtisar/BarisDua';
import { BarisTiga } from './ikhtisar/BarisTiga';
import { BarisEmpat } from './ikhtisar/BarisEmpat';

export function Ikhtisar() {
  const [rentang, setRentang] = useState<Rentang>('7');
  const [putaran, setPutaran] = useState(0);
  const hari = HARI_RENTANG[rentang];
  const ringkasan = useAksi<RingkasanV2>('ringkasan', { hari });

  function muatUlang() {
    ringkasan.muatUlang();
    setPutaran((p) => p + 1);
  }

  return (
    <IsiHalaman>
      <KepalaIkhtisar rentang={rentang} onRentang={setRentang} onMuatUlang={muatUlang} eskalasiTerbuka={ringkasan.data?.eskalasi_terbuka ?? null} />
      <motion.div key={`${putaran}-${rentang}`} variants={INDUK_UBIN} initial="awal" animate="tampil" className="grid grid-cols-12 gap-5">
        <BarisMetrik data={ringkasan.data} memuat={ringkasan.memuat} galat={ringkasan.galat} muatUlang={ringkasan.muatUlang} />
        <BarisDua />
        <BarisTiga rentang={rentang} hari={hari} />
        <BarisEmpat hari={hari} ringkasan={ringkasan.data} />
      </motion.div>
    </IsiHalaman>
  );
}
