import { usePageTitle } from '@/hooks/use-page-title';

export default function About() {
  usePageTitle(
    'About Vuka Afrique | Our Mission',
    "Learn about Vuka Afrique's mission to connect African trainers and trainees through a skills-first marketplace.",
  );

  return (
    <div className="py-16 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-dark mb-6">About Vuka Afrique</h1>
        <div className="prose prose-lg text-body">
          <p>
            Vuka Afrique is an African skills marketplace that connects trainees with expert trainers in income-earning
            skills. Whether you want to learn a trade, start a business, or teach what you know — Vuka Afrique makes it
            easy to find the right match across Africa.
          </p>
          <p className="mt-4">
            Our mission is to empower individuals by providing a platform where practical, income-earning skills can be
            shared and learned effectively. We believe in the power of education to transform lives and drive economic
            growth across the continent.
          </p>
        </div>
      </div>
    </div>
  );
}
