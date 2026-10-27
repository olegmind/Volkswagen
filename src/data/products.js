import car1 from "../../images/1.jpg";
import car2 from "../../images/2.webp";
import car3 from "../../images/3.jpg";
import car4 from "../../images/4.jpg";
import car5 from "../../images/5.jpg";
import car6 from "../../images/6.jpg";
import car7 from "../../images/7.jpg";
import car8 from "../../images/8.jpg";
import car9 from "../../images/pexels-234741447-12499702.webp";
import car10 from "../../images/pexels-ardit-mbrati-216809103-16646416.webp";
import car11 from "../../images/pexels-can-acikgoz-2151734019-31825291.webp";
import car12 from "../../images/pexels-clement-proust-363898785-21880068.webp";
import car13 from "../../images/pexels-connorscottmcmanus-15240993.webp";
import car14 from "../../images/pexels-hellojoshwithers-16625624.webp";
import car15 from "../../images/pexels-introspectivedsgn-4713812.webp";
import car16 from "../../images/pexels-o-click-fotografias-2163822876-39218495.webp";
import car17 from "../../images/pexels-pexels-user-399617868-14840571.webp";
import car18 from "../../images/pexels-tshepang-dd2-2159673654-36674013.webp";
import car19 from "../../images/pexels-vlasceanu-20027400.webp";

const productData = [
  [17000, car1],
  [15000, car2],
  [12000, car3],
  [16000, car4],
  [10000, car5],
  [17000, car6],
  [18000, car7],
  [12000, car8],
  [18500, car9],
  [16200, car10],
  [14300, car11],
  [19800, car12],
  [17600, car13],
  [15400, car14],
  [22100, car15],
  [16900, car16],
  [12800, car17],
  [20700, car18],
  [23900, car19],
  [14300, car11],
  [12000, car8],
];

export const products = productData.map(([priceUSD, img], index) => ({
  id: index + 1,
  title: `Volkswagen ${index + 1}`,
  priceUSD,
  img,
}));
