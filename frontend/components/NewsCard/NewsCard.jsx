import { Body, H3, H2, Link, Subtitle } from "@leafygreen-ui/typography";
import styles from "./NewsCard.module.css";

export default function NewsCard({ item }) {
  return (
    <div className={styles.newsCard}>
      <div className={styles.newsHeader}>
        <Link href={item.link} target="_blank" className={styles.newsHeadline}>
          {item.headline}
        </Link>
        <span className={styles.newsTime}>{item.posted}</span>
      </div>
      <Body className={styles.newsDescription}>{item.description}</Body>
      <Body className={styles.newsSource}>{item.source}</Body>
    </div>
  );
}