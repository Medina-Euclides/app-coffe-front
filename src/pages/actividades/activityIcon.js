// Elige un ícono para la actividad según palabras de su nombre.
// Las actividades las escribe cada productor, así que se buscan raíces comunes
// del vocabulario cafetero; si no hay coincidencia se usa una hoja.
import {
  Bean,
  Bug,
  Cherry,
  Droplets,
  Fence,
  Leaf,
  Package,
  Scissors,
  Shovel,
  SprayCan,
  Sprout,
  Sun,
  Trees,
  Truck,
  Wrench,
} from 'lucide-react';

const reglas = [
  [/recolec|cosech|graneo|pepeo|repase|cereza/, Cherry],
  [/fumig|aspers|herbicid|plaguicid|fungicid/, SprayCan],
  [/broca|plaga|roya|insect|control/, Bug],
  [/poda|zoque|desbrot|deschup|descope|corte/, Scissors],
  [/abon|fertiliz|encal|enmiend/, Package],
  [/siembr|almacig|germin|semill|chapol|vivero/, Sprout],
  [/deshierb|desyerb|maleza|plate|guadan|\broce|hoyad|ahoy|traz|desmalez|limpi/, Shovel],
  [/rieg|agua/, Droplets],
  [/secad|patio|marquesin/, Sun],
  [/benefici|despulp|lavad|ferment|trill/, Bean],
  [/transport|acarre|carg|empaqu/, Truck],
  [/cerc|alambr/, Fence],
  [/sombr|arbol|\btala|lena\b/, Trees],
  [/manten|repar|arregl/, Wrench],
];

function normalizar(texto) {
  return String(texto || '')
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function getActivityIcon(activity) {
  const nombre = normalizar(activity?.name);
  const regla = reglas.find(([patron]) => patron.test(nombre));
  if (regla) return regla[1];
  return activity?.is_harvest ? Cherry : Leaf;
}
