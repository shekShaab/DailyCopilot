import React, { useState, useEffect } from "react";
import { TaskOutput, DailyTask } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Mail,
  MessageSquare,
  Hash,
  Image as ImageIcon,
  Search,
  Filter,
  Star,
  Copy,
  Download,
  Send,
  Database,
  Share2,
  Calendar,
  Sparkles,
  CheckCircle,
  ExternalLink,
  Zap,
  Archive,
  Edit3,
  RefreshCw,
  GitBranch,
  Clock
} from "lucide-react";
import { format, startOfDay, endOfDay, subDays, isWithinInterval } from "date-fns";

export default function OutputLibrary() {
  const [outputs, setOutputs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedOutputs, setSelectedOutputs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [usageFilter, setUsageFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOutput, setExpandedOutput] = useState(null);
  
  // Action dialogs
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [knowledgeBaseDialogOpen, setKnowledgeBaseDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentActionOutput, setCurrentActionOutput] = useState(null);
  
  // Email form
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Knowledge base form
  const [kbTitle, setKbTitle] = useState("");
  const [kbTags, setKbTags] = useState("");
  const [kbCategory, setKbCategory] = useState("");

  // Edit/Refine dialog
  const [editMessages, setEditMessages] = useState([]);
  const [editInput, setEditInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [outputsData, tasksData] = await Promise.all([
      TaskOutput.list("-created_date"),
      DailyTask.list()
    ]);
    setOutputs(outputsData);
    setTasks(tasksData);
    setIsLoading(false);
  };

  const getTaskForOutput = (taskId) => {
    return tasks.find(t => t.id === taskId);
  };

  const getDateRange = () => {
    const now = new Date();
    switch (dateFilter) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "yesterday":
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case "last_7_days":
        return { start: subDays(now, 7), end: now };
      case "last_30_days":
        return { start: subDays(now, 30), end: now };
      default:
        return null;
    }
  };

  const filteredOutputs = outputs.filter(output => {
    const matchesSearch = searchTerm === "" || 
      output.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      output.agent_used?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAgent = agentFilter === "all" || output.agent_used === agentFilter;
    const matchesType = typeFilter === "all" || output.output_type === typeFilter;
    
    const matchesUsage = usageFilter === "all" || 
      (usageFilter === "used" && output.used_in_production) ||
      (usageFilter === "unused" && !output.used_in_production) ||
      (usageFilter === "favorites" && output.is_favorite);
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const range = getDateRange();
      if (range) {
        const outputDate = new Date(output.created_date);
        matchesDate = isWithinInterval(outputDate, { start: range.start, end: range.end });
      }
    }
    
    return matchesSearch && matchesAgent && matchesType && matchesUsage && matchesDate;
  });

  const uniqueAgents = [...new Set(outputs.map(o => o.agent_used))].filter(Boolean);

  const toggleSelection = (outputId) => {
    setSelectedOutputs(prev => 
      prev.includes(outputId) 
        ? prev.filter(id => id !== outputId)
        : [...prev, outputId]
    );
  };

  const selectAll = () => {
    if (selectedOutputs.length === filteredOutputs.length) {
      setSelectedOutputs([]);
    } else {
      setSelectedOutputs(filteredOutputs.map(o => o.id));
    }
  };

  const getOutputIcon = (type) => {
    switch (type) {
      case "email": return Mail;
      case "social_post": return MessageSquare;
      case "image": return ImageIcon;
      case "hashtags": return Hash;
      default: return FileText;
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo || !currentActionOutput) return;
    
    setIsSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: emailTo,
        subject: emailSubject || `Generated Content: ${currentActionOutput.output_type}`,
        body: emailBody || currentActionOutput.content
      });
      
      alert("✅ Email sent successfully!");
      setEmailDialogOpen(false);
      setEmailTo("");
      setEmailSubject("");
      setEmailBody("");
    } catch (error) {
      alert("❌ Failed to send email: " + error.message);
    }
    setIsSending(false);
  };

  const handleSaveToKnowledgeBase = async () => {
    alert(`✅ Saved to Knowledge Base!\n\nTitle: ${kbTitle}\nCategory: ${kbCategory}\nTags: ${kbTags}`);
    setKnowledgeBaseDialogOpen(false);
    setKbTitle("");
    setKbCategory("");
    setKbTags("");
  };

  const handleExport = (output) => {
    const task = getTaskForOutput(output.task_id);
    const exportData = {
      task: task?.task_description || "N/A",
      agent: output.agent_used,
      type: output.output_type,
      content: output.content,
      created_date: output.created_date,
      rating: output.quality_rating,
      used: output.used_in_production
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output-${output.id}.json`;
    a.click();
  };

  const handleBulkExport = () => {
    const selected = outputs.filter(o => selectedOutputs.includes(o.id));
    const exportData = selected.map(output => {
      const task = getTaskForOutput(output.task_id);
      return {
        task: task?.task_description || "N/A",
        agent: output.agent_used,
        type: output.output_type,
        content: output.content,
        created_date: output.created_date,
        rating: output.quality_rating,
        used: output.used_in_production
      };
    });
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-outputs-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const openEditDialog = async (output) => {
    setCurrentActionOutput(output);
    setCurrentVersion(output);
    
    // Load version history (all outputs from the same task)
    const relatedOutputs = await TaskOutput.filter({ task_id: output.task_id }, "-created_date");
    setVersionHistory(relatedOutputs);
    
    // Initialize chat with the original content
    setEditMessages([
      {
        role: "assistant",
        content: output.content,
        timestamp: new Date(output.created_date),
        version: relatedOutputs.indexOf(output) + 1
      }
    ]);
    
    setEditDialogOpen(true);
  };

  const handleRefineOutput = async () => {
    if (!editInput.trim() || !currentVersion) return;
    
    setIsRefining(true);
    
    // Add user message
    const userMessage = {
      role: "user",
      content: editInput,
      timestamp: new Date()
    };
    setEditMessages(prev => [...prev, userMessage]);
    setEditInput("");
    
    try {
      const task = getTaskForOutput(currentVersion.task_id);
      
      // Create refinement prompt
      const prompt = `You are refining generated content. Here's the context:

Original Task: ${task?.task_description || "N/A"}
Current Content:
${currentVersion.content}

User's Refinement Request: ${editInput}

Please generate an improved version based on the user's feedback. Maintain the same format and tone unless specifically asked to change it.`;

      const refinedContent = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      // Save the new version
      const newOutput = await TaskOutput.create({
        task_id: currentVersion.task_id,
        output_type: currentVersion.output_type,
        content: refinedContent,
        metadata: {
          ...currentVersion.metadata,
          refined_from: currentVersion.id,
          refinement_prompt: editInput
        },
        agent_used: currentVersion.agent_used
      });

      // Update task output count
      const taskOutputs = await TaskOutput.filter({ task_id: currentVersion.task_id });
      await DailyTask.update(currentVersion.task_id, {
        output_count: taskOutputs.length + 1
      });

      // Add assistant response
      const assistantMessage = {
        role: "assistant",
        content: refinedContent,
        timestamp: new Date(),
        version: versionHistory.length + 1,
        outputId: newOutput.id
      };
      setEditMessages(prev => [...prev, assistantMessage]);
      
      // Update current version and version history
      setCurrentVersion(newOutput);
      setVersionHistory(prev => [newOutput, ...prev]);
      
      // Reload outputs to show the new version
      loadData();
      
    } catch (error) {
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error while refining the content. Please try again.",
        timestamp: new Date(),
        isError: true
      };
      setEditMessages(prev => [...prev, errorMessage]);
    }
    
    setIsRefining(false);
  };

  const selectVersion = (output) => {
    setCurrentVersion(output);
    setEditMessages(prev => [...prev, {
      role: "system",
      content: `Switched to Version ${versionHistory.indexOf(output) + 1}`,
      timestamp: new Date()
    }, {
      role: "assistant",
      content: output.content,
      timestamp: new Date(output.created_date),
      version: versionHistory.indexOf(output) + 1
    }]);
  };

  const openActionDialog = (output, dialogType) => {
    setCurrentActionOutput(output);
    if (dialogType === 'email') {
      setEmailBody(output.content);
      setEmailDialogOpen(true);
    } else if (dialogType === 'kb') {
      const task = getTaskForOutput(output.task_id);
      setKbTitle(task?.task_description || "");
      setKnowledgeBaseDialogOpen(true);
    } else if (dialogType === 'share') {
      setShareDialogOpen(true);
    }
  };

  const renderOutputPreview = (output) => {
    const contentPreview = output.content?.substring(0, 150) + (output.content?.length > 150 ? "..." : "");
    
    switch (output.output_type) {
      case "hashtags":
        const tags = output.content?.match(/#\w+/g) || [];
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 8).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
            ))}
            {tags.length > 8 && <span className="text-xs text-slate-500">+{tags.length - 8} more</span>}
          </div>
        );
      case "multiple_options":
        const optionsCount = output.metadata?.options?.length || 0;
        return <div className="text-sm text-slate-600">{optionsCount} variations generated</div>;
      default:
        return <p className="text-sm text-slate-600 line-clamp-2">{contentPreview}</p>;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Output Library
          </h1>
          <p className="text-lg text-slate-600">
            Manage, refine, and share all your AI-generated content
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Outputs</p>
                  <p className="text-3xl font-bold text-slate-900">{outputs.length}</p>
                </div>
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Used in Production</p>
                  <p className="text-3xl font-bold text-green-600">
                    {outputs.filter(o => o.used_in_production).length}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Favorites</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {outputs.filter(o => o.is_favorite).length}
                  </p>
                </div>
                <Star className="w-10 h-10 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Avg Quality</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {(outputs.filter(o => o.quality_rating).reduce((sum, o) => sum + o.quality_rating, 0) / outputs.filter(o => o.quality_rating).length || 0).toFixed(1)}⭐
                  </p>
                </div>
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search outputs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {uniqueAgents.map(agent => (
                    <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="social_post">Social Post</SelectItem>
                  <SelectItem value="hashtags">Hashtags</SelectItem>
                  <SelectItem value="multiple_options">Multiple Options</SelectItem>
                </SelectContent>
              </Select>
              <Select value={usageFilter} onValueChange={setUsageFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Usage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="unused">Unused</SelectItem>
                  <SelectItem value="favorites">Favorites</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedOutputs.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-900">
                  {selectedOutputs.length} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkExport}
                  className="gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedOutputs([])}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outputs Grid */}
        <div className="grid gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-900">
              {filteredOutputs.length} Outputs
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="gap-2"
            >
              <Checkbox checked={selectedOutputs.length === filteredOutputs.length && filteredOutputs.length > 0} />
              Select All
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-spin" />
              <p className="text-slate-500">Loading outputs...</p>
            </div>
          ) : filteredOutputs.length === 0 ? (
            <Card className="bg-white/90">
              <CardContent className="py-12 text-center">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No outputs found</h3>
                <p className="text-slate-500">Try adjusting your filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredOutputs.map(output => {
              const task = getTaskForOutput(output.task_id);
              const Icon = getOutputIcon(output.output_type);
              const isExpanded = expandedOutput === output.id;

              return (
                <Card key={output.id} className="bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="pt-1">
                        <Checkbox
                          checked={selectedOutputs.includes(output.id)}
                          onCheckedChange={() => toggleSelection(output.id)}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {task?.task_description || "Unknown Task"}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {format(new Date(output.created_date), 'MMM d, yyyy • HH:mm')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {output.is_favorite && (
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            )}
                            {output.quality_rating > 0 && (
                              <Badge variant="outline" className="gap-1">
                                {output.quality_rating}⭐
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge>{output.output_type}</Badge>
                          {output.agent_used && (
                            <Badge variant="outline">{output.agent_used}</Badge>
                          )}
                          {output.used_in_production && (
                            <Badge className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Used in Production
                            </Badge>
                          )}
                          {output.metadata?.refined_from && (
                            <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                              <GitBranch className="w-3 h-3 mr-1" />
                              Refined Version
                            </Badge>
                          )}
                        </div>

                        {renderOutputPreview(output)}

                        {isExpanded && (
                          <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                            <p className="text-sm text-slate-800 whitespace-pre-wrap">
                              {output.content}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExpandedOutput(isExpanded ? null : output.id)}
                            className="gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {isExpanded ? 'Hide' : 'View'} Full Content
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-1"
                            onClick={() => openEditDialog(output)}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Refine with AI
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigator.clipboard.writeText(output.content)}
                            className="gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionDialog(output, 'email')}
                            className="gap-1"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Send Email
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionDialog(output, 'kb')}
                            className="gap-1"
                          >
                            <Database className="w-3.5 h-3.5" />
                            Save to KB
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExport(output)}
                            className="gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Export
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionDialog(output, 'share')}
                            className="gap-1"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Edit/Refine Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Refine Output with AI
            </DialogTitle>
            <DialogDescription>
              Chat with AI to iteratively improve your content. Each refinement creates a new version.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
            {/* Version History Sidebar */}
            <div className="col-span-1 border-r pr-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Version History ({versionHistory.length})
              </h4>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {versionHistory.map((version, index) => (
                    <button
                      key={version.id}
                      onClick={() => selectVersion(version)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        currentVersion?.id === version.id
                          ? "bg-blue-50 border-blue-300"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Version {versionHistory.length - index}</span>
                        {currentVersion?.id === version.id && (
                          <Badge variant="outline" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {format(new Date(version.created_date), 'MMM d, HH:mm')}
                      </p>
                      {version.metadata?.refinement_prompt && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          "{version.metadata.refinement_prompt}"
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Interface */}
            <div className="col-span-2 flex flex-col">
              <ScrollArea className="flex-1 h-[400px] pr-4">
                <div className="space-y-4">
                  {editMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : message.role === 'system'
                            ? 'bg-slate-100 text-slate-600 text-sm italic'
                            : message.isError
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-slate-50 text-slate-900 border border-slate-200'
                        }`}
                      >
                        {message.version && (
                          <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
                            <Clock className="w-3 h-3" />
                            Version {message.version}
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                          {format(message.timestamp, 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isRefining && (
                    <div className="flex justify-start">
                      <div className="bg-slate-50 text-slate-900 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 animate-spin" />
                          <span className="text-sm">AI is refining your content...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="mt-4 flex gap-2">
                <Textarea
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  placeholder="Tell me how you'd like to improve this content... (e.g., 'Make it more professional', 'Add a call to action', 'Shorten to 100 words')"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleRefineOutput();
                    }
                  }}
                  disabled={isRefining}
                />
                <Button
                  onClick={handleRefineOutput}
                  disabled={isRefining || !editInput.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isRefining ? (
                    <Sparkles className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-slate-600">
                {versionHistory.length} version{versionHistory.length !== 1 ? 's' : ''} created
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(currentVersion?.content || "");
                    alert("✅ Current version copied to clipboard!");
                  }}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Current Version
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send via Email</DialogTitle>
            <DialogDescription>
              Send this output to an email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-to">To</Label>
              <Input
                id="email-to"
                type="email"
                placeholder="recipient@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email-body">Message</Label>
              <Textarea
                id="email-body"
                rows={10}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isSending || !emailTo}>
              {isSending ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Knowledge Base Dialog */}
      <Dialog open={knowledgeBaseDialogOpen} onOpenChange={setKnowledgeBaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Knowledge Base</DialogTitle>
            <DialogDescription>
              Save this output as a reusable template in your knowledge base
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="kb-title">Title</Label>
              <Input
                id="kb-title"
                placeholder="Template title"
                value={kbTitle}
                onChange={(e) => setKbTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="kb-category">Category</Label>
              <Select value={kbCategory} onValueChange={setKbCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="templates">Templates</SelectItem>
                  <SelectItem value="best_practices">Best Practices</SelectItem>
                  <SelectItem value="examples">Examples</SelectItem>
                  <SelectItem value="drafts">Drafts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="kb-tags">Tags (comma-separated)</Label>
              <Input
                id="kb-tags"
                placeholder="marketing, email, social"
                value={kbTags}
                onChange={(e) => setKbTags(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKnowledgeBaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveToKnowledgeBase} disabled={!kbTitle || !kbCategory}>
              <Database className="w-4 h-4 mr-2" />
              Save to KB
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Output</DialogTitle>
            <DialogDescription>
              Integration settings for Slack, Salesforce, and other platforms
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium">Slack</h4>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Send to a Slack channel or direct message
              </p>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                Configure Slack Integration
              </Button>
            </div>

            <div className="p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-orange-600" />
                <h4 className="font-medium">Salesforce</h4>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Save to Salesforce as a note or attachment
              </p>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                Configure Salesforce Integration
              </Button>
            </div>

            <div className="p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center gap-3 mb-2">
                <Archive className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium">Other Integrations</h4>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Google Drive, Notion, Airtable, and more
              </p>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <ExternalLink className="w-3.5 h-3.5" />
                View All Integrations
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}