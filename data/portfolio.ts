export interface PortfolioProject {
  slug: string
  category: string
  title: string
  description: string
  image: string
  client: string
  services: string
  year: string
  challenge: string
  solution: string
  result: string
  prevSlug: string | null
  nextSlug: string | null
  nextLabel: string | null
}

export const portfolioProjects: PortfolioProject[] = [
  {
    slug: 'nippon',
    category: 'Cinematic Visuals',
    title: 'Nippon Express Global',
    description:
      'Menerjemahkan skala dan kecepatan raksasa logistik global ke dalam sebuah narasi visual yang sinematik dan memukau.',
    image: '/images/company.png',
    client: 'Nippon Express',
    services: 'Corporate Video, Drone Footage, Post-Production',
    year: '2025',
    challenge:
      'Nippon Express adalah salah satu perusahaan logistik terbesar di dunia. Tantangan utamanya adalah bagaimana menampilkan infrastruktur raksasa, operasi yang rumit, dan teknologi mutakhir mereka dalam sebuah video pendek yang tidak membosankan, melainkan mendebarkan dan elegan, serta mudah dipahami oleh pemangku kepentingan internasional.',
    solution:
      'Tim kami menggunakan pendekatan hyper-cinematic. Kami menerbangkan drone beresolusi tinggi di area pergudangan dan pelabuhan, dikombinasikan dengan teknik slow-motion darat untuk menangkap detail humanis dari para pekerja. Dipadukan dengan color grading bergaya teal-and-orange khas film Hollywood dan dentuman sonic branding yang solid.',
    result:
      'Video profil ini sukses meningkatkan konversi interaksi B2B dalam berbagai pameran internasional. Desain visual yang premium secara instan meningkatkan persepsi brand value Nippon Express di pasar Asia Tenggara.',
    prevSlug: null,
    nextSlug: 'aston',
    nextLabel: 'Aston Bogor',
  },
  {
    slug: 'aston',
    category: 'Brand Experience',
    title: 'Aston Bogor Hybrid Event',
    description:
      'Mengorkestrasikan pengalaman hybrid event kelas dunia yang menjembatani peserta online dan offline secara mulus.',
    image: '/images/office.png',
    client: 'Aston Bogor Hotel & Resort',
    services: 'Event Coverage, Live Streaming, Brand Experience',
    year: '2025',
    challenge:
      'Aston Bogor membutuhkan solusi hybrid event yang mampu menghadirkan pengalaman yang sama berkesan bagi peserta yang hadir secara fisik maupun yang bergabung secara virtual dari berbagai kota.',
    solution:
      'AMK merancang sistem multi-kamera dengan live streaming berkualitas broadcast, dikombinasikan dengan grafis interaktif real-time dan manajemen konten digital yang sinkron dengan agenda acara.',
    result:
      'Hybrid event berjalan tanpa hambatan teknis. Tingkat partisipasi virtual meningkat signifikan, dan klien mendapatkan rekaman berkualitas tinggi yang kemudian digunakan sebagai aset pemasaran jangka panjang.',
    prevSlug: 'nippon',
    nextSlug: 'jica',
    nextLabel: 'JICA Innovation Hub',
  },
  {
    slug: 'jica',
    category: 'Digital Strategy',
    title: 'JICA Innovation Hub',
    description:
      'Membangun narasi digital yang kuat untuk mendukung program inovasi dan pemberdayaan komunitas JICA di Indonesia.',
    image: '/images/tech.png',
    client: 'JICA (Japan International Cooperation Agency)',
    services: 'Digital Marketing, Content Creation, Social Media Strategy',
    year: '2024',
    challenge:
      'JICA memerlukan strategi komunikasi digital yang mampu menjangkau audiens muda Indonesia sekaligus mempertahankan citra kelembagaan internasional yang prestisius.',
    solution:
      'Kami merancang konten bilingual (Indonesia-Inggris) dengan tone yang segar dan menggunakan storytelling berbasis dampak sosial. Pendekatan ini dikombinasikan dengan distribusi lintas platform yang terukur.',
    result:
      'Jangkauan organik meningkat drastis dalam tiga bulan pertama kampanye. Program-program JICA berhasil menarik lebih banyak pendaftar muda berkualitas dari berbagai universitas terkemuka di Indonesia.',
    prevSlug: 'aston',
    nextSlug: null,
    nextLabel: null,
  },
]

export function getProjectBySlug(slug: string): PortfolioProject | undefined {
  return portfolioProjects.find((p) => p.slug === slug)
}
