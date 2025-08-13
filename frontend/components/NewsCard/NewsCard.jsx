import { Body, H3, H2, Link, Subtitle } from "@leafygreen-ui/typography";
import styles from "./NewsCard.module.css";

export default function NewsCard({ item }) {
  
  // Function to normalize old dates to "2 weeks ago"
  const normalizeDate = (postedDate) => {
    if (!postedDate) return "2 weeks ago";
    
    const dateStr = postedDate.toLowerCase();
    
    // Check for year(s) or month(s) patterns
    if (dateStr.includes("year") || dateStr.includes("month")) {
      return "2 weeks ago";
    }
    
    // Check for ISO date format (YYYY-MM-DDTHH:MM:SS.sssZ or YYYY-MM-DD)
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (isoDatePattern.test(postedDate)) {
      return "2 weeks ago";
    }
    
    // Return original date if it's recent (days, weeks, hours, minutes)
    return postedDate;
  };
  
  return (
    <div className={styles.newsCard}>
      <div className={styles.newsHeader}>
        <Link href={item.link} target="_blank" className={styles.newsHeadline}>
          {item.headline}
        </Link>
        <span className={styles.newsTime}>{normalizeDate(item.posted)}</span>
      </div>
      <Body className={styles.newsDescription}>{item.description}</Body>
      <Body className={styles.newsSource}>{item.source}</Body>
    </div>
  );
}