
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { InvokeLLM } from "@/integrations/Core";
import { MessageSquare, Sparkles, Copy, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DailyTask, TaskOutput } from "@/entities/all";

export default function CaptionWriter() {
  const [postDescription, setPostDescription] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [tone, setTone] = useState("Witty");
  const [cta, setCta] = useState("");
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [captions, setCaptions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const task = urlParams.get('task');
    const taskId = urlParams.get('taskId');

    const initialize = () => {
      if (task) {
        setPostDescription(task);
      }
      if (taskId) {
        setCurrentTaskId(taskId);
      }
    };

    initialize();
  }, []);

  const generateCaptions = async () => {
    if (!postDescription.trim()) {
      alert('Please enter a post description');
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Generate 3 creative ${tone.toLowerCase()} captions for ${platform} based on this description: "${postDescription}".
      ${cta ? `Include this call-to-action: ${cta}` : ''}
      ${includeEmojis ? 'Include relevant emojis.' : 'No emojis.'}
      Return each caption on a new line, numbered 1-3.`;

      const result = await InvokeLLM({ prompt });
      const captionList = result.split('\n').filter(line => line.trim() !== '');
      setCaptions(captionList);
      
      // Save output if linked to a task
      if (currentTaskId) {
        await TaskOutput.create({
          task_id: currentTaskId,
          output_type: "multiple_options",
          content: result,
          metadata: {
            platform,
            options: captionList
          },
          agent_used: "Caption Writer"
        });
        
        await DailyTask.update(currentTaskId, {
          has_output: true,
          agent_used: true,
          output_count: captionList.length
        });
      }
    } catch (error) {
      console.error("Error generating captions:", error);
      setCaptions(["Error generating captions. Please try again."]);
    }
    setIsGenerating(false);
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-orange-50 to-yellow-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("DailyTaskHelper")}>
          <Button variant="ghost" className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Tasks
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-600 to-yellow-600 rounded-2xl mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent mb-3">
            Caption Writer
          </h1>
          <p className="text-lg text-slate-600">
            Generate compelling captions that resonate with your audience.
          </p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>Caption Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="post-description">Post Description or Image Context</Label>
              <Textarea
                id="post-description"
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                placeholder="e.g., A picture of a person hiking on a mountain at sunrise."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="Twitter">Twitter</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone of Voice</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Witty">Witty</SelectItem>
                    <SelectItem value="Inspirational">Inspirational</SelectItem>
                    <SelectItem value="Question">Question</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta">Call to Action (CTA) - Optional</Label>
              <Input
                id="cta"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="e.g., Link in bio, Shop now"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="emojis"
                checked={includeEmojis}
                onCheckedChange={setIncludeEmojis}
              />
              <Label htmlFor="emojis" className="cursor-pointer">Include Emojis</Label>
            </div>

            <Button
              onClick={generateCaptions}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Caption
                </>
              )}
            </Button>

            {captions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Generated Captions</h3>
                <div className="space-y-3">
                  {captions.map((caption, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start justify-between gap-3">
                      <p className="text-slate-800 flex-1">{caption}</p>
                      <Button
                        onClick={() => navigator.clipboard.writeText(caption)}
                        variant="ghost"
                        size="sm"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
