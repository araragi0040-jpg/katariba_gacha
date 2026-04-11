/**
 * ここだけ、しゅうさんの既存ニュースサイトのログイン実装に合わせて差し替えてください。
 * 例:
 * - Supabase のセッションから user.id / user.name を取得
 * - 独自cookie / JWT から内部固定 userId を取得
 */

export type CurrentUser = {
  userId: string;
  displayName: string;
  isAdmin?: boolean;
};

export async function getCurrentUserFromNewsApp(_request: Request): Promise<CurrentUser | null> {
  // ---- 仮実装ここから ----
  // 開発中だけ ENV で擬似ログインしたい場合に使えます。
  const devUserId = process.env.GACHA_DEV_USER_ID;
  const devDisplayName = process.env.GACHA_DEV_DISPLAY_NAME || '開発用ユーザー';

  if (process.env.NODE_ENV !== 'production' && devUserId) {
    return {
      userId: devUserId,
      displayName: devDisplayName,
      isAdmin: true,
    };
  }
  // ---- 仮実装ここまで ----

  return null;
}
