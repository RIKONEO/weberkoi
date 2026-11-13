// Odmiany koi na stronach /odmiany/<slug>: adres z nazwy i krótki opis dla klienta (i dla Google).

/** "Showa Sanshoku" -> "showa-sanshoku". */
export function varietySlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Opisy najpopularniejszych odmian. Szukamy po pierwszym pasującym słowie z nazwy w panelu. */
const INFO: [RegExp, string][] = [
  [/tancho/, "Tancho to koi z jedną czerwoną plamą na głowie, najlepiej okrągłą, na czystym białym ciele. Kojarzy się z flagą Japonii i jest jedną z najbardziej rozpoznawalnych odmian."],
  [/kohaku/, "Kohaku to biała koi z czerwonymi plamami (hi). Najstarsza i najbardziej ceniona odmiana gosanke: liczy się czysta biel, głęboka czerwień i ostre brzegi plam."],
  [/showa/, "Showa Sanshoku to koi czarna z czerwonymi i białymi plamami. Czarny kolor (sumi) oplata ciało i często schodzi na płetwy piersiowe. Kolory dojrzewają z wiekiem, więc młode ryby potrafią się mocno zmienić."],
  [/sanke|sanshoku/, "Taisho Sanke to biała koi z czerwonymi plamami i małymi czarnymi akcentami na grzbiecie. Razem z Kohaku i Showa tworzy klasyczną trójkę gosanke."],
  [/chagoi/, "Chagoi to brązowa lub oliwkowa koi o jednolitym kolorze. Spokojna i bardzo ufna, szybko je z ręki, rośnie duża i często prowadzi resztę stada do karmienia."],
  [/ogon|yamabuki|platinum|platyn/, "Ogon to koi jednolitego, metalicznego koloru: złotego (Yamabuki), platynowego albo pomarańczowego. Błyszczy w wodzie i dobrze widać ją nawet w głębszym stawie."],
  [/asagi/, "Asagi to koi z niebieskim grzbietem w siateczkę łusek i czerwonymi bokami oraz płetwami. Jedna z najstarszych odmian, z której wywodzi się wiele innych."],
  [/shusui/, "Shusui to bezłuska (doitsu) wersja Asagi: niebieski grzbiet z rzędem dużych łusek wzdłuż kręgosłupa i czerwone boki."],
  [/bekko/, "Bekko to koi jednego koloru (białego, czerwonego albo żółtego) z czarnymi plamami na grzbiecie, bez czerwieni na głowie."],
  [/utsuri/, "Utsurimono to czarna koi z jednym kolorem plam: białym (Shiro Utsuri), czerwonym (Hi Utsuri) albo żółtym (Ki Utsuri)."],
  [/goshiki/, "Goshiki to koi o pięciu kolorach: czerwone plamy na biało-niebieskim tle z ciemną siateczką łusek. Kolor tła zależy od temperatury wody."],
  [/kujaku/, "Kujaku to metaliczna koi z siateczką łusek na grzbiecie i czerwonymi lub pomarańczowymi plamami. Mieni się w słońcu."],
  [/kumonryu/, "Kumonryu to bezłuska czarno-biała koi, której wzór zmienia się w ciągu roku, zależnie od wody i temperatury."],
  [/ochiba/, "Ochiba to szaroniebieska koi z brązowymi lub miedzianymi plamami, przypominającymi jesienne liście na wodzie."],
  [/soragoi/, "Soragoi to szaroniebieska koi jednego koloru, spokojna i ufna jak Chagoi."],
  [/karashi|kigoi/, "Karashi i Kigoi to żółte koi jednego koloru. Bardzo ufne, szybko rosną i dobrze ożywiają staw."],
  [/butterfly|motyl|hirenaga/, "Koi z długimi płetwami (butterfly, hirenaga) mają długie, powiewające płetwy i ogon. Wyglądają efektownie z boku i z góry."],
];

export function varietyInfo(name: string): string {
  const n = name.toLowerCase();
  return (
    INFO.find(([re]) => re.test(n))?.[1] ??
    `${name} to jedna z odmian koi, które mamy w stawach. Każdą rybę pokazujemy na filmiku, zanim zdecydujesz się na zakup.`
  );
}
