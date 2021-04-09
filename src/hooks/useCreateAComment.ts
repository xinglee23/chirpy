import { RTEValue } from '$/blocks/RichTextEditor/RichTextEditor';
import { useToastContext } from '$/components/Toast';
import { useInsertOneCommentMutation } from '$/graphql/generated/comment';

import { useCurrentUser } from './useCurrentUser';

export type useCreateACommentOptions = {
  pageId: string;
};

export type SubmitHandler = (reply: RTEValue, commentId?: string, depth?: number) => Promise<void>;

export function useCreateAComment({ pageId }: useCreateACommentOptions): SubmitHandler {
  const { isLogin } = useCurrentUser();
  const [insertOneComment] = useInsertOneCommentMutation();

  const { showToast } = useToastContext();

  const handleSubmitReply: SubmitHandler = async (
    reply: RTEValue,
    commentId?: string,
    depth?: number,
  ) => {
    if (!isLogin) {
      console.error('Navigate to login page');
      return Promise.reject();
    }
    const { data } = await insertOneComment({
      variables: {
        parentId: commentId,
        content: reply,
        pageId,
        depth: depth ? depth + 1 : 1,
      },
    });
    if (!data?.insertOneComment?.id) {
      showToast({
        type: 'error',
        title: `Sever didn't respond, please try again later.`,
      });
      console.error(`Can't insert a comment, parentId ${commentId}`);
    }
  };
  return handleSubmitReply;
}