// レストラン情報の型
export type Restaurant = {
  id: string;
  name: string;
  imageUrl?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  eventId: string;
  _count?: {
    votes: number;
  };
};

// 投票情報の型
export type Vote = {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  voterToken: string;
  restaurantId: string;
  eventId: string;
};

// フォーム送信用のデータ型
export type RestaurantFormData = {
  id?: string;
  name: string;
  imageUrl?: string;
  websiteUrl?: string;
  description?: string;
  eventId: string;
}; 