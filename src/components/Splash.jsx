import styles from './Splash.module.css';

export default function Splash({ onContinue }) {
    return (
        <div className={styles.overlay}>
            <div className={styles.content}>
                <div className={styles.logo}>
                    <span className={styles.logoEmoji}>🍦</span>
                </div>
                <h1 className={styles.brand}>Natura</h1>
                <p className={styles.tagline}>Heladería Artesanal</p>
            </div>
            <button
                className={styles.continueBtn}
                onClick={onContinue}
            >
                CONTINUAR
            </button>
        </div>
    );
}
