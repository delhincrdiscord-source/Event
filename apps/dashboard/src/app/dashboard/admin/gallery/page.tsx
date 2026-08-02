"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, Check, Trash2, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getGalleryItems, approveGalleryItem, deleteGalleryItem, type GalleryItemData } from "./_actions/gallery";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getGalleryItems({ page, perPage: 20 });
      if (result.success && result.data) {
        setGalleryItems(result.data.items);
        setTotal(result.data.total);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleApprove(id: string) {
    const result = await approveGalleryItem(id);
    if (result.success) {
      setGalleryItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isApproved: true } : i))
      );
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteGalleryItem(id);
    if (result.success) {
      setGalleryItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((prev) => prev - 1);
    }
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gallery</h1>
            <p className="text-muted-foreground">
              {total} submissions
            </p>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : galleryItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm text-muted-foreground">
              No gallery submissions yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {galleryItems.map((galleryItem) => (
            <Card key={galleryItem.id} className="overflow-hidden">
              <div className="aspect-square bg-muted">
                {galleryItem.media.mimeType.startsWith("image/") ? (
                  <img
                    src={galleryItem.media.url}
                    alt={galleryItem.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium">{galleryItem.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      by {galleryItem.author.username}
                    </p>
                  </div>
                  <Badge variant={galleryItem.isApproved ? "default" : "secondary"}>
                    {galleryItem.isApproved ? "Approved" : "Pending"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {!galleryItem.isApproved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(galleryItem.id)}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Approve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(galleryItem.media.url, "_blank")}
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto text-destructive"
                    onClick={() => handleDelete(galleryItem.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
