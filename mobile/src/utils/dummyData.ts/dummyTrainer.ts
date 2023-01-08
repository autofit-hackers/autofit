import { Trainer } from '../training';

export const dummyTrainer: Trainer = {
  id: '1',
  name: 'John Doe',
  imageUrl: 'https://picsum.photos/200',
  bio: "a trainer's bio",
};

export const dummyTrainers: Trainer[] = [
  {
    id: '1',
    name: 'Alice Miller',
    imageUrl:
      'https://images.unsplash.com/photo-1672909695237-66c249136679?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2787&q=80',
    bio: 'アイスホッケー部',
  },
  {
    id: '2',
    name: 'Bob Smith',
    imageUrl:
      'https://images.unsplash.com/photo-1565765311910-a9e4174df9be?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=774&q=80',
    bio: '東京大学B＆W部',
  },
  {
    id: '3',
    name: 'Chris Jones',
    imageUrl:
      'https://images.unsplash.com/flagged/photo-1585257939818-5abce1c3ec6f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1026&q=80',
    bio: 'トレーニング挑戦中',
  },
];
