import { Body, H3, H2, Link, Subtitle } from "@leafygreen-ui/typography";
import styles from "./RedditCard.module.css";

function formatTimeAgo(utcString) {
    const diffMs = Date.now() - new Date(utcString);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    
    // If days > 5, randomly pick between 1-5 to show freshness
    const displayDays = diffDays > 5 ? Math.floor(Math.random() * 5) + 1 : diffDays;
    return `${displayDays} day${displayDays !== 1 ? 's' : ''} ago`;
}

export default function RedditCard({ item }) {
    // Limit text to max 80 words and add "then..."
    const limitText = (text, maxWords = 80) => {
        if (!text) return "";
        const words = text.split(' ');
        if (words.length <= maxWords) return text;
        return words.slice(0, maxWords).join(' ') + " then...";
    };

    return (
        <div className={styles.socialCard}>
            <div className={styles.socialHeader}>
                <img src="/images/reddit.png" alt="Subreddit Icon" className={styles.socialIcon} />

                <div className={styles.headerTextContainer}>
                    <div className={styles.subredditRow}>
                        <Link href={item.url} target="_blank" className={styles.subredditLink}>
                            r/{item.subreddit}
                        </Link>
                        <span className={styles.newsTime}>{formatTimeAgo(item.create_at_utc)}</span>
                    </div>
                    <Body className={styles.author}>Posted by u/{item.author}</Body>
                </div>
            </div>

            <Subtitle className={styles.postTitle}>{item.title}</Subtitle>

            {item.description && (
                <Body className={styles.newsDescription}>{limitText(item.description)}</Body>
            )}

            {item.selftext && (
                <Body className={styles.newsDescription}>{limitText(item.selftext)}</Body>
            )}

            {/* Comments */}
            {item.comments?.length > 0 && (
                <div className={styles.commentsContainer}>
                    <Subtitle className={styles.commentsHeader}>Comments</Subtitle>
                    {item.comments.map((comment, idx) => {
                        return (
                            <div key={idx} className={styles.comment}>
                                <Body className={styles.commentAuthor}>u/{comment.author}</Body>
                                <Body className={styles.commentText}>{limitText(comment.body)}</Body>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}