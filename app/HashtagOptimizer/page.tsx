
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/integrations/Core";
import { Hash, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DailyTask, TaskOutput } from "@/entities/all";

export default function HashtagOptimizer() {
  const [postText, setPostText] = useState("");
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [hashtagType, setHashtagType] = useState("All");
  const [hashtags, setHashtags] = useState({ broad: [], niche: [], location: [] });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const task = urlParams.get('task');
    const taskId = urlParams.get('taskId');

    const initialize = () => {
      if (task) {
        setPostText(task);
      }
      if (taskId) {
        setCurrentTaskId(taskId);
      }
    };

    initialize();
  }, []);

  const generateHashtags = async () => {
    if (!postText.trim()) {
      alert('Please enter post text or topic');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Generate strategic hashtags for this post: "${postText}".
      ${niche ? `Industry/Niche: ${niche}` : ''}
      ${location ? `Location: ${location}` : ''}
      Type: ${hashtagType}
      
      Return hashtags in 3 categories:
      BROAD: (3-5 broad hashtags)
      NICHE: (3-5 niche-specific hashtags)
      ${location ? 'LOCATION: (2-3 location-specific hashtags)' : ''}
      
      Format each hashtag with # prefix, separated by commas within each category.`;

      const result = await InvokeLLM({ prompt });
      
      const categories = {
        broad: [],
        niche: [],
        location: []
      };

      const lines = result.split('\n');
      let currentCategory = '';
      
      lines.forEach(line => {
        if (line.toUpperCase().includes('BROAD')) {
          currentCategory = 'broad';
        } else if (line.toUpperCase().includes('NICHE')) {
          currentCategory = 'niche';
        } else if (line.toUpperCase().includes('LOCATION')) {
          currentCategory = 'location';
        } else if (line.includes('#') && currentCategory) {
          const tags = line.match(/#\w+/g) || [];
          categories[currentCategory].push(...tags);
        }
      });

      setHashtags(categories);
      
      // Save output if linked to a task
      if (currentTaskId) {
        await TaskOutput.create({
          task_id: currentTaskId,
          output_type: "hashtags",
          content: result,
          metadata: {
            categories
          },
          agent_used: "Hashtag Optimizer"
        });
        
        await DailyTask.update(currentTaskId, {
          has_output: true,
          agent_used: true
        });
      }
    } catch (error) {
      console.error(error);
      setHashtags({ broad: ['#error'], niche: [], location: [] });
    }
    setIsGenerating(false);
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-green-50 to-teal-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("DailyTaskHelper")}>
          <Button variant="ghost" className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Tasks
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl mb-4">
            <Hash className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-3">
            Hashtag Optimizer
          </h1>
          <p className="text-lg text-slate-600">
            Get strategic hashtag suggestions to increase your content&apos;s reach.
          </p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>Hashtag Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="post-text">Post Text or Topic</Label>
              <Textarea
                id="post-text"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="e.g., A delicious homemade pizza with fresh basil and mozzarella."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="niche">Industry/Niche</Label>
                <Input
                  id="niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g., food, travel"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., New York"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hashtag-type">Hashtag Type</Label>
                <Select value={hashtagType} onValueChange={setHashtagType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Broad">Broad</SelectItem>
                    <SelectItem value="Niche">Niche</SelectItem>
                    <SelectItem value="Branded">Branded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={generateHashtags}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Hash className="w-5 h-5" />
                  Generate Hashtags
                </>
              )}
            </Button>

            {(hashtags.broad.length > 0 || hashtags.niche.length > 0 || hashtags.location.length > 0) && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Generated Hashtags</h3>
                
                {hashtags.broad.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Broad</h4>
                    <div className="flex flex-wrap gap-2">
                      {hashtags.broad.map((tag, i) => (
                        <Badge key={i} className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {hashtags.niche.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Niche</h4>
                    <div className="flex flex-wrap gap-2">
                      {hashtags.niche.map((tag, i) => (
                        <Badge key={i} className="bg-green-100 text-green-800 text-sm px-3 py-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {hashtags.location.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Location-Specific</h4>
                    <div className="flex flex-wrap gap-2">
                      {hashtags.location.map((tag, i) => (
                        <Badge key={i} className="bg-purple-100 text-purple-800 text-sm px-3 py-1">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
