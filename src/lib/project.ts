export interface ProjectImage {
  id: number;
  image_url: string;
  image_low_url?: string | null;
  caption: string;
  order: number;
  is_cover?: boolean;
}

export interface Project {
  id: number;
  title: string;
  title_i18n?: Record<string, string>;
  content_i18n?: Record<string, { md?: string } | undefined>;
  order: number;
  hidden: boolean;
  categories?: string[];
  suggested_project?: number | null;
  images: ProjectImage[];
}

export function projectTitle(project: Project | null | undefined, lang: string): string {
  if (!project) return '';
  return (
    project.title_i18n?.[lang] || project.title || Object.values(project.title_i18n || {})[0] || ''
  );
}

export function coverImage(project: Project | null | undefined): ProjectImage | undefined {
  return project?.images?.find((img) => img.is_cover) || project?.images?.[0];
}

export function padNumber(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
