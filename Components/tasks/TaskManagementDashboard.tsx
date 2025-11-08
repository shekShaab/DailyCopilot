"use client";
import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import Link from 'next/link';


import {
  CheckCircle,
  Clock,
  XCircle,
  PlayCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Zap,
  FileText,
  Sparkles,
  Eye,
  ChevronDown,
  ChevronUp,
  Copy,
  Star,
  StarOff,
  Share2,
  Hash,
  Mail,
  MessageSquare,
  Image as ImageIcon
} from "lucide-react";
import { format, isToday, startOfDay } from "date-fns";

export default function TaskManagementDashboard({
  tasks,
  onTaskUpdate,
  agentIcons,
  agentColors,
  categoryColors,
  filterDate = "today",
  showStats = false
}) {
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [taskOutputs, setTaskOutputs] = useState({});
  const [selectedOutputIndex, setSelectedOutputIndex] = useState({});

  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.task_date);
    const today = startOfDay(new Date());
    const taskDay = startOfDay(taskDate);

    let dateMatch = true;
    if (filterDate === "today") {
      dateMatch = taskDay.getTime() === today.getTime();
    }

    const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
    const categoryMatch = categoryFilter === "all" || task.category === categoryFilter;

    return dateMatch && priorityMatch && categoryMatch;
  });

  const todayTasks = tasks.filter(task => isToday(new Date(task.task_date)));
  const pendingTasks = todayTasks.filter(t => t.status === 'pending');
  const inProgressTasks = todayTasks.filter(t => t.status === 'in_progress');
  const completedTasks = todayTasks.filter(t => t.status === 'completed');
  const completionRate = todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0;

  const updateTaskStatus = async (taskId, newStatus) => {
    const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const updatedTasks = allTasks.map(t => {
      if (t.id === taskId) {
        const updateData = { ...t, status: newStatus };
        if (newStatus === 'completed') {
          updateData.completion_date = new Date().toISOString();
        }
        return updateData;
      }
      return t;
    });
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    onTaskUpdate();
  };

  const updateTaskPriority = async (taskId, newPriority) => {
    const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const updatedTasks = allTasks.map(t =>
      t.id === taskId ? { ...t, priority: newPriority } : t
    );
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    onTaskUpdate();
  };

  const loadTaskOutputs = async (taskId) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
      return;
    }

    setExpandedTaskId(taskId);
    const allOutputs = JSON.parse(localStorage.getItem('taskOutputs') || '[]');
    const outputs = allOutputs.filter(output => output.task_id === taskId);
    setTaskOutputs(prev => ({ ...prev, [taskId]: outputs }));
    setSelectedOutputIndex(prev => ({ ...prev, [taskId]: 0 }));
  };

  const toggleFavorite = async (output) => {
    const allOutputs = JSON.parse(localStorage.getItem('taskOutputs') || '[]');
    const updatedOutputs = allOutputs.map(o =>
      o.id === output.id ? { ...o, is_favorite: !o.is_favorite } : o
    );
    localStorage.setItem('taskOutputs', JSON.stringify(updatedOutputs));
    loadTaskOutputs(expandedTaskId);
  };

  const rateOutput = async (output, rating) => {
    const allOutputs = JSON.parse(localStorage.getItem('taskOutputs') || '[]');
    const updatedOutputs = allOutputs.map(o =>
      o.id === output.id ? { ...o, quality_rating: rating } : o
    );
    localStorage.setItem('taskOutputs', JSON.stringify(updatedOutputs));
    loadTaskOutputs(expandedTaskId);
  };

  const markAsUsed = async (output) => {
    const allOutputs = JSON.parse(localStorage.getItem('taskOutputs') || '[]');
    const updatedOutputs = allOutputs.map(o =>
      o.id === output.id ? { ...o, used_in_production: true, published_date: new Date().toISOString() } : o
    );
    localStorage.setItem('taskOutputs', JSON.stringify(updatedOutputs));
    loadTaskOutputs(expandedTaskId);
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

  const renderOutputContent = (output) => {
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
                    onClick={() => navigator.clipboard.writeText(option)}
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

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const priorityColors = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-blue-100 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700"
  };

  const statusIcons = {
    pending: Clock,
    in_progress: PlayCircle,
    completed: CheckCircle,
    cancelled: XCircle
  };

  return (
    <div className="space-y-6">
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/90 backdrop-blur-sm border-yellow-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{pendingTasks.length}</div>
              <p className="text-xs text-slate-500 mt-1">Tasks to start</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-blue-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{inProgressTasks.length}</div>
              <p className="text-xs text-slate-500 mt-1">Active tasks</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-green-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completedTasks.length}</div>
              <p className="text-xs text-slate-500 mt-1">Tasks done</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-purple-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{completionRate}%</div>
              <p className="text-xs text-slate-500 mt-1">Today's progress</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{filterDate === "today" ? "Today's Tasks" : "All Tasks"} ({filteredTasks.length})</CardTitle>
            <div className="flex gap-3">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Content Creation">Content Creation</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                  <SelectItem value="Strategy">Strategy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks found</h3>
              <p className="text-slate-500">Add some tasks to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const AgentIcon = agentIcons[task.suggested_agent] || FileText;
                const StatusIcon = statusIcons[task.status];
                const isExpanded = expandedTaskId === task.id;
                const outputs = taskOutputs[task.id] || [];
                const selectedIndex = selectedOutputIndex[task.id] || 0;
                const selectedOutput = outputs[selectedIndex];

                return (
                  <div key={task.id} className="space-y-0">
                    <div
                      className={`p-4 rounded-lg border-2 transition-all ${
                        task.status === 'completed' ? 'bg-green-50 border-green-200 opacity-75' :
                        task.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                        'bg-white border-slate-200 hover:border-slate-300'
                      } ${isExpanded ? 'rounded-b-none' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="pt-1">
                          <Checkbox
                            checked={task.status === 'completed'}
                            onCheckedChange={(checked) =>
                              updateTaskStatus(task.id, checked ? 'completed' : 'pending')
                            }
                            className="w-5 h-5"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <p className={`text-slate-900 font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                              {task.task_description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Select
                                value={task.priority}
                                onValueChange={(value) => updateTaskPriority(task.id, value)}
                              >
                                <SelectTrigger className="w-24 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge className={statusColors[task.status]}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {task.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={`${categoryColors[task.category]} border`}>
                              {task.category}
                            </Badge>
                            <Badge className={priorityColors[task.priority]}>
                              {task.priority} priority
                            </Badge>
                            {task.agent_used && (
                              <Badge className="bg-purple-100 text-purple-800">
                                <Zap className="w-3 h-3 mr-1" />
                                AI Used
                              </Badge>
                            )}
                            {task.has_output && (
                              <Badge className="bg-purple-100 text-purple-800">
                                <FileText className="w-3 h-3 mr-1" />
                                {task.output_count || 1} Output{task.output_count > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${agentColors[task.suggested_agent]}`}>
                                <AgentIcon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-sm text-slate-600">{task.suggested_agent}</span>
                            </div>

                            <div className="flex gap-2">
                              {task.has_output && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => loadTaskOutputs(task.id)}
                                  className="gap-1"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  {isExpanded ? 'Hide' : 'View'} Outputs
                                </Button>
                              )}
                              {task.status !== 'in_progress' && task.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                  className="gap-1"
                                >
                                  <PlayCircle className="w-3.5 h-3.5" />
                                  Start
                                </Button>
                              )}
                              {task.agent_page && task.status !== 'completed' && (
                                <a href={`/${task.agent_page}?task=${encodeURIComponent(task.task_description)}&taskId=${task.id}`}>
                                  <Button
                                    size="sm"
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-1"
                                    onClick={async () => {
                                      await DailyTask.update(task.id, {
                                        agent_used: true,
                                        status: 'in_progress'
                                      });
                                      onTaskUpdate();
                                    }}
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Open Agent
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Output Section */}
                    {isExpanded && outputs.length > 0 && (
                      <div className="border-2 border-t-0 border-slate-200 rounded-b-lg p-4 bg-slate-50">
                        {/* Output Tabs */}
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                          {outputs.map((output, index) => {
                            const Icon = getOutputIcon(output.output_type);
                            return (
                              <button
                                key={output.id}
                                onClick={() => setSelectedOutputIndex(prev => ({ ...prev, [task.id]: index }))}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all whitespace-nowrap ${
                                  selectedIndex === index
                                    ? "bg-blue-100 border-blue-300 text-blue-700"
                                    : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm font-medium">Output #{index + 1}</span>
                                {output.is_favorite && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                                {output.used_in_production && (
                                  <Badge variant="outline" className="ml-1 text-xs bg-green-50 text-green-700 border-green-200">Used</Badge>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected Output Content */}
                        {selectedOutput && (
                          <div className="space-y-4">
                            {/* Output Metadata */}
                            <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
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
                                  onClick={() => navigator.clipboard.writeText(selectedOutput.content)}
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
                            {renderOutputContent(selectedOutput)}

                            {/* Rating */}
                            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
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
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}