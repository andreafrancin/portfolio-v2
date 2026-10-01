import { fetchProjectsFromNewAPI } from '../services/work/api-request';
import type { Project } from './project';

let cached: Project[] | null = null;
let inflight: Promise<Project[]> | null = null;

export function getCachedProjects(): Project[] | null {
  return cached;
}

export function loadPublicProjects(force = false): Promise<Project[]> {
  if (cached && !force) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = fetchProjectsFromNewAPI()
    .then((response: Project[]) => {
      cached = (response || []).filter((p) => !p.hidden).sort((a, b) => a.order - b.order);
      return cached;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function invalidateProjects() {
  cached = null;
}
