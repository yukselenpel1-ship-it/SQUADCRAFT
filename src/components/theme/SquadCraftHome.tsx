
"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./SquadCraftHome.module.css";

type Props = {
  hasCareer?: boolean;
  careerClubName?: string;
  onNewCareer: () => void;
  onContinueCareer: () => void;
  onFeedback: () => void;
};

const features = [
  {
    title: "CANLI MAÇ MERKEZİ",
    description: "Maçları canlı takip et, istatistikleri anlık gör ve oyunun heyecanını yaşa.",
    image: "/theme/feature-live-match.webp",
    accent: "lime",
  },
  {
    title: "TRANSFER & TAKTİK",
    description: "Kadronu güçlendir, oyun planını kur ve rakiplerine üstünlük sağla.",
    image: "/theme/feature-transfer-tactics.webp",
    accent: "lime",
  },
  {
    title: "SCOUT & GELİŞİM",
    description: "Geleceğin yıldızlarını keşfet, oyuncularını geliştir ve değerlerini artır.",
    image: "/theme/feature-transfer-tactics.webp",
    accent: "lime",
  },
  {
    title: "ÇOK OYUNCULU REKABET",
    description: "Arkadaşlarına karşı oyna, kendi ligini kur ve global sıralamada yerini al.",
    image: "/theme/feature-multiplayer.webp",
    accent: "cyan",
  },
];

export default function SquadCraftHome({
  hasCareer,
  careerClubName,
  onNewCareer,
  onContinueCareer,
  onFeedback,
}: Props) {
  return (
    <main className={`sc-theme-page ${styles.page}`}>
      <div className={styles.background} />

      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <div className={styles.brand}>
            <Image src="/images/sc-emblem-official-hd.png" alt="" width={38} height={38} />
            <div className={styles.brandText}>SQUADCRAFT</div>
          </div>

          <nav className={styles.navLinks}>
            <Link href="/" className={styles.navActive}>ANA SAYFA</Link>
            <button onClick={hasCareer ? onContinueCareer : onNewCareer}>KARİYER MODU</button>
            <Link href="/draft">DRAFT LİGİ</Link>
            <a href="#features">ÖZELLİKLER</a>
          </nav>

          <div className={styles.navActions}>
            <button className={styles.iconButton} onClick={onFeedback} aria-label="Geri bildirim">⌕</button>
            <span className={styles.langButton}>TR⌄</span>
            <button className={styles.ghostButton} onClick={hasCareer ? onContinueCareer : onNewCareer}>KARİYERİ AÇ</button>
            <button className={styles.joinButton} onClick={onNewCareer}>HEMEN KAYIT OL</button>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <p className={styles.kicker}>F U T B O L U &nbsp; S E N &nbsp; Y Ö N E T</p>
        <h1 className={styles.heroTitle}>
          <span>SQUAD</span><em>CRAFT</em>
        </h1>
        <p className={styles.heroMeta}>KUR <b>•</b> DRAFT ET <b>•</b> YARIŞ <b>•</b> ZAFERE ULAŞ</p>
      </section>

      <section className={styles.modeGrid}>
        <article className={`${styles.modeCard} ${styles.careerCard}`}>
          <div className={styles.modeVisualCareer}>
            <Image
              src="/theme/career-manager.webp"
              alt=""
              fill
              priority
              className={styles.modeImageContain}
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </div>
          <div className={styles.modeShade} />
          <div className={styles.modeContent}>
            <span className={styles.tagLime}>MENAJER OL // KULÜBÜNÜ İNŞA ET</span>
            <h2><strong>KARİYER</strong> <em>MODU</em></h2>
            <p>
              Kendi kulübünü yönet, transferlerini yap, taktiğini belirle ve efsane bir kariyer inşa et.
              Yerel liglerden Avrupa'nın zirvesine uzanan yolculuk senin elinde.
            </p>

            <div className={styles.ctaRow}>
              <button onClick={hasCareer ? onContinueCareer : onNewCareer} className={styles.careerCta}>
                {hasCareer ? `DEVAM ET (${careerClubName})` : "KARİYERE BAŞLA"} <span>→</span>
              </button>
              {hasCareer && <button onClick={onNewCareer} className={styles.newButton}>YENİ</button>}
            </div>

            <div className={styles.miniFeatures}>
              <span>⇄<small>Transfer</small></span>
              <span>⚔<small>Taktik</small></span>
              <span>▥<small>Gelişim</small></span>
              <span>♜<small>Zafer</small></span>
            </div>
          </div>
        </article>

        <article className={`${styles.modeCard} ${styles.draftCard}`}>
          <div className={styles.modeVisualDraft}>
            <Image
              src="/theme/draft-trophy.webp"
              alt=""
              fill
              priority
              className={styles.modeImageContain}
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </div>
          <div className={styles.modeShade} />
          <div className={styles.modeContent}>
            <span className={styles.tagCyan}>GERÇEK OYUNCULAR // CANLI REKABET</span>
            <h2><strong>DRAFT</strong> <em>LİGİ</em></h2>
            <p>
              Sıfırdan kadro kur, arkadaşlarınla veya diğer menajerlerle aynı ligde mücadele et.
              Stratejini konuştur, haftalık maçlarla en iyinin kim olduğunu göster.
            </p>

            <Link href="/draft" className={styles.draftCta}>DRAFT&apos;A GİR <span>→</span></Link>

            <div className={styles.miniFeatures}>
              <span>♙<small>Lig Kur</small></span>
              <span>♙<small>Arkadaşla Oyna</small></span>
              <span>⌁<small>Canlı Maçlar</small></span>
              <span>♜<small>Ödüller</small></span>
            </div>
          </div>
        </article>
      </section>

      <section id="features" className={styles.featureGrid}>
        {features.map((f) => (
          <article className={styles.featureCard} key={f.title}>
            <div className={styles.featureImage}>
              <Image src={f.image} alt="" fill className={styles.featureImageEl} sizes="25vw" />
            </div>
            <div className={styles.featureBody}>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          </article>
        ))}
      </section>

      <footer className={styles.statsBar}>
        <div><b>250K+</b><span>AKTİF MENAJER</span></div>
        <div><b>4 LİG MODU</b><span>KARİYER & DRAFT</span></div>
        <div><b>GERÇEK ZAMANLI</b><span>MAÇ DENEYİMİ</span></div>
        <div><b>BÜYÜYEN TOPLULUK</b><span>TÜRKİYE VE DAHA FAZLASI</span></div>
        <div className={styles.footerSlogan}><span>DAHA FAZLA</span><b>BİR MENAJERLİK DENEYİMİ</b></div>
      </footer>
    </main>
  );
}
