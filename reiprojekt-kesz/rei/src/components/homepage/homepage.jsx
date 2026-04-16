import Fejlecala from '../fejlec/Fejlecaala';
import Kategoriak from '../kategoria/Kategoriak';
import KotelezoDarabok from '../kotelezodarabok/Kotelezodarabok';
import Hirlevel from '../hirlevel/Hirlevel';

export default function HomePage() {
  return (
    <>
      <Fejlecala />
      <Kategoriak />
      <KotelezoDarabok />
      <Hirlevel />
    </>
  );
}