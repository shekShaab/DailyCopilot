
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InvokeLLM } from "@/integrations/Core";
import { FileText, Sparkles, Copy, Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DailyTask, TaskOutput } from "@/entities/all";

export default function ContentGenerator() {
  const [prompt, setPrompt] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const task = urlParams.get('task');
    const taskId = urlParams.get('taskId');

    const initialize = () => {
      if (task) {
        setPrompt(task);
      }
      if (taskId) {
        setCurrentTaskId(taskId);
      }
    };

    initialize();
  }, []);

  const generateContent = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await InvokeLLM({
        prompt: `Generate compelling social media content based on this request: ${prompt}. Make it engaging, relevant, and platform-appropriate.`,
        add_context_from_internet: false
      });
      setGeneratedContent(result);
      
      // Save output if linked to a task
      if (currentTaskId) {
        await TaskOutput.create({
          task_id: currentTaskId,
          output_type: "text",
          content: result,
          agent_used: "Content Generator"
        });
        
        // Update task
        await DailyTask.update(currentTaskId, {
          has_output: true,
          agent_used: true
        });
      }
    } catch (error) {
      setGeneratedContent("Error generating content. Please try again.");
    }
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("DailyTaskHelper")}>
          <Button variant="ghost" className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Tasks
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Content Generator
          </h1>
          <p className="text-lg text-slate-600">
            Describe the content you want to create, and the AI will generate it for you.
          </p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle>Your Prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A tweet about the importance of AI in social media management."
              rows={5}
              className="font-mono"
            />

            <Button
              onClick={generateContent}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
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
                  Generate Content
                </>
              )}
            </Button>

            {generatedContent && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900">Generated Content</h3>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {generatedContent}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
