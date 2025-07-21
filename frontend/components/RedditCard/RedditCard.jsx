import { Body, H3, H2, Link, Subtitle } from "@leafygreen-ui/typography";
import styles from "./RedditCard.module.css";

function formatTimeAgo(utcString) {
    const diffMs = Date.now() - new Date(utcString);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

export default function RedditCard({ item }) {
    return (
        <div className={styles.socialCard}>
            <div className={styles.socialHeader}>
                <img src="/images/reddit.png" alt="Subreddit Icon" className={styles.socialIcon} />

                <div className={styles.headerTextContainer}>
                    <Link href={item.url} target="_blank" className={styles.subredditLink}>
                        r/{item.subreddit}
                    </Link>
                    <span className={styles.newsTime}>{formatTimeAgo(item.create_at_utc)}</span>
                </div>

                <Body className={styles.author}>Posted by u/{item.author}</Body>
            </div>

            <Subtitle className={styles.postTitle}>{item.title}</Subtitle>

            {item.description && (
                <Body className={styles.newsDescription}>{item.description}</Body>
            )}

            {/* Comments */}
            {item.comments?.length > 0 && (
                <div className={styles.commentsContainer}>
                    <Subtitle className={styles.commentsHeader}>Comments</Subtitle>
                    {item.comments.map((comment, idx) => (
                        <div key={idx} className={styles.comment}>
                            <Body className={styles.commentAuthor}>u/{comment.author}</Body>
                            <Body className={styles.commentText}>{comment.body}</Body>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}