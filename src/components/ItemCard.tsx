"use client";

import Link from "next/link";

interface ItemCardProps {
  title: string;
  description: string;
  category: string;
  href: string;
  tags?: string[];
}

export function ItemCard({ title, description, category, href, tags = [] }: ItemCardProps) {
  return (
    <Link href={href}>
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-blue-500 hover:bg-gray-750 transition-all cursor-pointer h-full">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
            {category}
          </span>
          {tags.map((tag) => (
            <span key={tag} className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-400">
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm line-clamp-2">{description}</p>
      </div>
    </Link>
  );
}
