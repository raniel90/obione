import { domainCommunities } from "@/lib/community-data";

export function slugifyDomain(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function findDomainCommunityBySlug(slug: string) {
  return domainCommunities.find((c) => slugifyDomain(c.domain) === slug);
}
