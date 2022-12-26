import LatestTrainingList from '../1_templates/LatestTrainingList';
import MenuList from '../1_templates/MenuList';

export default function Top() {
  const trainings = [
    {
      title: 'test',
      image: 'https://picsum.photos/200/300',
    },
    {
      title: 'test2',
      image: 'https://picsum.photos/200/300',
    },
    {
      title: 'test3',
      image: 'https://picsum.photos/200/300',
    },
  ];

  const menus = [
    {
      title: 'test',
      image: 'https://picsum.photos/200/300',
    },
    {
      title: 'test2',
      image: 'https://picsum.photos/200/300',
    },
  ];

  return (
    <>
      <LatestTrainingList trainings={trainings} />
      <MenuList workouts={menus} />
    </>
  );
}
