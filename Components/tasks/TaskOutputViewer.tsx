import React, { useState, useEffect } from "react";
import { TaskOutput } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy,
  Download,
  Star,
  StarOff,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  Hash,
  Mail,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Share2
} from "lucide-react";

export default function TaskOutputViewer({ taskId, onClose }) {
  const [outputs, setOutputs] = useState([]);
  const [selectedOutput, setSelectedOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOutputs = async () => {
    setIsLoading(true);
    const data = await TaskOutput.filter({ task_id: taskId }, "-created_date");
    setOutputs(data);
    if (data.length > 0) {
      setSelectedOutput(data[0]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const doLoad = async () => {
      await loadOutputs();
    };
    doLoad();
  }, [taskId]);

  const toggleFavorite = async (output) => {
    await TaskOutput.update(output.id, { is_favorite: !output.is_favorite });
    loadOutputs();
  };

  const rateOutput = async (output, rating) => {
    await TaskOutput.update(output.id, { quality_rating: rating });
    loadOutputs();
  };

  const markAsUsed = async (output) => {
    await TaskOutput.update(output.id, {
      used_in_production: true,
      published_date: new Date().toISOString()
    });
    loadOutputs();
  };

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
  };

  const getOutputIcon = (type) => {
    switch (type) {
      case "email": return Mail;
      case "social_post": return MessageSquare;
      case "image": return ImageIcon;
      case "hashtags": return Hash;
      case "text": return FileText;
      default: return FileText;
    }
  };

  const renderOutput = (output) => {
    if (!output) return null;

    switch (output.output_type) {
      case "email":
        return (
          <div className="space-y-4">
            {output.metadata?.subject && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-slate-700">Subject:</label>
                <p className="text-slate-900 mt-1">{output.metadata.subject}</p>
              </div>
            )}
            <div className="bg-white border rounded-lg p-4">
              <label className="text-sm font-medium text-slate-700 block mb-2">Email Body:</label>
              <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">
                {output.content}
              </div>
            </div>
          </div>
        );

      case "social_post":
        return (
          <div className="space-y-4">
            {output.metadata?.platform && (
              <Badge className="mb-2">{output.metadata.platform}</Badge>
            )}
            <div className="bg-white border rounded-lg p-6">
              <p className="text-slate-900 whitespace-pre-wrap leading-relaxed text-lg">
                {output.content}
              </p>
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            {output.metadata?.image_url && (
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={output.metadata.image_url}
                  alt="Generated"
                  className="w-full h-auto"
                />
              </div>
            )}
            {output.content && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-slate-700">Description:</label>
                <p className="text-slate-800 mt-2">{output.content}</p>
              </div>
            )}
          </div>
        );

      case "hashtags":
        return (
          <div className="space-y-4">
            {output.metadata?.categories && Object.keys(output.metadata.categories).map(category => (
              <div key={category} className="bg-white border rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-3 capitalize">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {output.metadata.categories[category].map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case "multiple_options":
        return (
          <div className="space-y-3">
            {output.metadata?.options?.map((option, index) => (
              <div key={index} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-slate-800 flex-1">{option}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(option)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div className="bg-white border rounded-lg p-4">
            <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">
              {output.content}
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-slate-500">Loading outputs...</div>
        </CardContent>
      </Card>
    );
  }

  if (outputs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-medium text-slate-900 mb-1">No outputs yet</h3>
            <p className="text-slate-500 text-sm">
              Use an AI agent to generate output for this task
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Task Outputs ({outputs.length})
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Output Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {outputs.map((output, index) => {
              const Icon = getOutputIcon(output.output_type);
              return (
                <button
                  key={output.id}
                  onClick={() => setSelectedOutput(output)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                    selectedOutput?.id === output.id
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">Output #{index + 1}</span>
                  {output.is_favorite && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                  {output.used_in_production && (
                    <Badge variant="outline" className="ml-1 text-xs">Used</Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Output */}
          {selectedOutput && (
            <div className="space-y-4">
              {/* Output Metadata */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge>{selectedOutput.output_type}</Badge>
                  {selectedOutput.agent_used && (
                    <span className="text-sm text-slate-600">by {selectedOutput.agent_used}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleFavorite(selectedOutput)}
                  >
                    {selectedOutput.is_favorite ? (
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(selectedOutput.content)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {!selectedOutput.used_in_production && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsUsed(selectedOutput)}
                      className="gap-1"
                    >
                      <Share2 className="w-3 h-3" />
                      Mark as Used
                    </Button>
                  )}
                </div>
              </div>

              {/* Render Output Content */}
              {renderOutput(selectedOutput)}

              {/* Rating */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">Rate this output:</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => rateOutput(selectedOutput, rating)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        selectedOutput.quality_rating >= rating
                          ? "bg-yellow-400 text-white"
                          : "bg-slate-200 text-slate-400 hover:bg-slate-300"
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                {selectedOutput.quality_rating > 0 && (
                  <span className="text-sm text-slate-600 ml-2">
                    Rated {selectedOutput.quality_rating}/5
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}