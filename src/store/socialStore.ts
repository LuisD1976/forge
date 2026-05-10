import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SocialPost, Friend } from '../types'
import { MOCK_FRIENDS, MOCK_POSTS } from '../data/social'

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface OnlineUser {
  userId: string
  username: string
  avatar: string
}

interface SocialState {
  posts: SocialPost[]
  pendingPosts: SocialPost[]
  friends: Friend[]
  onlineUsers: OnlineUser[]
  postsLoading: boolean
  realtimeStatus: RealtimeStatus

  setPosts: (posts: SocialPost[]) => void
  /** toPending=true → buffer for the "new posts" banner; false → straight to feed */
  prependPost: (post: SocialPost, toPending?: boolean) => void
  flushPending: () => void
  updatePostLikes: (postId: string, delta: number, hasLiked?: boolean) => void
  updatePostComments: (postId: string, delta: number) => void
  toggleLikeOptimistic: (postId: string) => void
  setFriends: (friends: Friend[]) => void
  toggleFollow: (friendId: string) => void
  addPost: (post: SocialPost) => void
  setPostsLoading: (v: boolean) => void
  setOnlineUsers: (users: OnlineUser[]) => void
  setRealtimeStatus: (status: RealtimeStatus) => void
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set) => ({
      posts: MOCK_POSTS,
      pendingPosts: [],
      friends: MOCK_FRIENDS,
      onlineUsers: [],
      postsLoading: false,
      realtimeStatus: 'disconnected',

      setPosts: (posts) => set({ posts }),

      prependPost: (post, toPending = false) =>
        set((state) =>
          toPending
            ? { pendingPosts: [post, ...state.pendingPosts] }
            : { posts: [post, ...state.posts] }
        ),

      flushPending: () =>
        set((state) => ({
          posts: [...state.pendingPosts, ...state.posts],
          pendingPosts: [],
        })),

      updatePostLikes: (postId, delta, hasLiked) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likes: Math.max(0, p.likes + delta),
                  ...(hasLiked !== undefined && { hasLiked }),
                }
              : p
          ),
        })),

      updatePostComments: (postId, delta) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, comments: Math.max(0, p.comments + delta) } : p
          ),
        })),

      toggleLikeOptimistic: (postId) =>
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? { ...p, hasLiked: !p.hasLiked, likes: p.hasLiked ? p.likes - 1 : p.likes + 1 }
              : p
          ),
        })),

      setFriends: (friends) => set({ friends }),

      toggleFollow: (friendId) =>
        set((state) => ({
          friends: state.friends.map((f) =>
            f.id === friendId ? { ...f, isFollowing: !f.isFollowing } : f
          ),
        })),

      addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),

      setPostsLoading: (v) => set({ postsLoading: v }),

      setOnlineUsers: (users) => set({ onlineUsers: users }),

      setRealtimeStatus: (status) => set({ realtimeStatus: status }),
    }),
    {
      name: 'forge-social',
      // Don't persist ephemeral state
      partialize: (state) => ({
        posts: state.posts,
        friends: state.friends,
      }),
    }
  )
)
