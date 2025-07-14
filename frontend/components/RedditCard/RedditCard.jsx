import { Body, H3, H2, Link, Subtitle } from "@leafygreen-ui/typography";
import styles from "./RedditCard.module.css";

export default function RedditCard({ item }) {
    return (
        <div className={styles.socialCard}>
            <div className={styles.socialHeader}>
                <img src="/images/reddit.png" alt="Subreddit Icon" className={styles.socialIcon} />

                <div className={styles.headerTextContainer}>
                    <Link href={item.url} target="_blank" className={styles.subredditLink}>
                        {/* r/{item.subreddit} */} r/subreddit
                    </Link>
                    {/* <span className={styles.newsTime}>{formatUtcToTimeAgo(item.create_at_utc)}</span> */}
                    <span className={styles.newsTime}>{item.posted}</span>
                </div>

                {/* <Body className={styles.author}>Posted by u/{item.author}</Body> */}
                <Body className={styles.author}>Posted by u/Author</Body>
            </div>

            {/* <Subtitle className={styles.postTitle}>{item.title}</Subtitle> */}
            <Subtitle className={styles.postTitle}>Title</Subtitle>

            {item.description && (
                <Body className={styles.newsDescription}>{item.description}</Body>
            )}

            {/* Comments
                                                {item.comments.length > 0 && (
                                                    <div className={styles.commentsContainer}>
                                                        <H5 className={styles.commentsHeader}>Comments</H5>
                                                        {item.comments.map((comment, idx) => (
                                                            <div key={idx} className={styles.comment}>
                                                                <Body className={styles.commentAuthor}>u/{comment.author}</Body>
                                                                <Body className={styles.commentText}>{comment.body}</Body>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )} */}
                                                
            {/* Comments */}
            <div className={styles.commentsContainer}>
                <Subtitle className={styles.commentsHeader}>Comments</Subtitle>
                {[
                    { author: "mock_user1", body: "This is super interesting!" },
                    { author: "mock_user2", body: "I’m not sure I agree with this." },
                    { author: "mock_user3", body: "Great analysis, thanks for sharing!" },
                ].map((comment, idx) => (
                    <div key={idx} className={styles.comment}>
                        <Body className={styles.commentAuthor}>u/{comment.author}</Body>
                        <Body className={styles.commentText}>{comment.body}</Body>
                    </div>
                ))}
            </div>
        </div>
    );
}