import React from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { loadConfig } from "../../lib/config";

export const ProjectDetail = (): JSX.Element => {
  const { id } = useParams();
  const cfg = React.useMemo(() => loadConfig(), []);
  const project = cfg.projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">项目未找到</div>
          <Link to="/" className="underline">返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-10 py-10">
      <header className="flex items-center justify-between mb-6">
        <Link to="/" className="text-xl font-semibold hover:opacity-70">Home</Link>
        <Link to="/" className="hover:opacity-70">Back</Link>
      </header>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {project.previewSrc && (
            <img src={project.previewSrc} alt={project.alt ?? project.title} className="w-full h-auto rounded" />
          )}
          <div className="flex gap-3">
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                <Button>See it live</Button>
              </a>
            )}
            <Link to="/">
              <Button variant="outline">Back to home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};