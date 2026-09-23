import CommentTree from "./CommentTree";

/**
 * Compatibility wrapper. Old contract { postId, comments, onAdd } keeps
 * working; new optional { postSlug, authorId, autoLoad } unlock the tree.
 * Callers: OpportunityCard, OpportunityDetail, Profile (via card), Reels modal.
 */
export default function CommentThread({
  postId,
  comments = [],
  onAdd,
  postSlug,
  authorId,
  autoLoad = true,
}) {
  return (
    <div className="pt-3 border-t border-border mt-3">
      <p className="text-xs font-semibold tracking-widest text-text-secondary">COMMENTS</p>
      <div className="mt-1">
        <CommentTree
          postId={postId}
          postSlug={postSlug}
          authorId={authorId}
          initialComments={comments}
          autoLoad={autoLoad}
          onAdd={onAdd}
        />
      </div>
    </div>
  );
}
