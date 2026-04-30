import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  type?: string;
  name?: string;
}

export function SEO({
  title = 'StudyTrack - Your Academic Life, Organized',
  description = 'Track your CGPA, manage your schedule, organize files, and stay on top of tasks. Everything you need to excel in college, in one place.',
  type = 'website',
  name = 'StudyTrack'
}: SEOProps) {
  return (
    <Helmet>
      { /* Standard metadata tags */ }
      <title>{title}</title>
      <meta name='description' content={description} />
      
      { /* Open Graph / Facebook tags */ }
      <meta property='og:type' content={type} />
      <meta property='og:title' content={title} />
      <meta property='og:description' content={description} />
      
      { /* Twitter tags */ }
      <meta name='twitter:creator' content={name} />
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={title} />
      <meta name='twitter:description' content={description} />
    </Helmet>
  );
}
