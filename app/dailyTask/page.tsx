"use client";
import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../../Components/ui/card";
import { Button } from "../../Components/ui/button";
import { Textarea } from "../../Components/ui/textarea";
import { Badge } from "../../Components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../Components/ui/tabs";


import {
  Sparkles,
  FileText,
  Hash,
  Calendar,
  TrendingUp,
  Target,
  BarChart3,
  Palette,
  MessageSquare,
  CheckCircle,
  Clock,
  BarChart2,
  Plus
} from "lucide-react";
import { format, isToday, isPast, isFuture, startOfDay } from "date-fns";
import TaskManagementDashboard from "../../Components/tasks/TaskManagementDashboard";
import TaskHistory from "../../Components/tasks/TaskHistory";

export default function DailyTaskHelper() {
  const [taskInput, setTaskInput] = useState("");
  const [processedTasks, setProcessedTasks] = useState([]);
  const [savedTasks, setSavedTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("today");

  const agentIcons = {
    'Content Generator': FileText,
    'Visual Designer': Palette,
    'Caption Writer': MessageSquare,
    'Hashtag Optimizer': Hash,
    'Scheduler Assistant': Calendar,
    'Analytics Insights': BarChart3,
    'Trend Monitor': TrendingUp,
    'Competitor Intel': Target,
    'Workflow Builder': Sparkles
  };

  const agentColors = {
    'Content Generator': 'bg-blue-100 text-blue-800',
    'Visual Designer': 'bg-pink-100 text-pink-800',
    'Caption Writer': 'bg-orange-100 text-orange-800',
    'Hashtag Optimizer': 'bg-green-100 text-green-800',
    'Scheduler Assistant': 'bg-purple-100 text-purple-800',
    'Analytics Insights': 'bg-red-100 text-red-800',
    'Trend Monitor': 'bg-teal-100 text-teal-800',
    'Competitor Intel': 'bg-amber-100 text-amber-800',
    'Workflow Builder': 'bg-indigo-100 text-indigo-800'
  };

  const categoryColors = {
    'Content Creation': 'bg-blue-50 text-blue-700 border-blue-200',
    'Design': 'bg-pink-50 text-pink-700 border-pink-200',
    'Marketing': 'bg-green-50 text-green-700 border-green-200',
    'Planning': 'bg-purple-50 text-purple-700 border-purple-200',
    'Analytics': 'bg-red-50 text-red-700 border-red-200',
    'Strategy': 'bg-amber-50 text-amber-700 border-amber-200',
    'Development': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Communication': 'bg-slate-50 text-slate-700 border-slate-200',
    'General': 'bg-gray-50 text-gray-700 border-gray-200'
  };

  const loadSavedTasks = async () => {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    setSavedTasks(tasks);
  };

  useEffect(() => {
    const doLoad = async () => {
      await loadSavedTasks();
    };
    doLoad();
  }, []);

  const suggestAgentAndCategory = (task) => {
    const taskLower = task.toLowerCase();
    
    if (taskLower.includes('post') || taskLower.includes('social media') || taskLower.includes('tweet') || taskLower.includes('content')) {
      return { agent: 'Content Generator', category: 'Content Creation', page: '/ContentGenerator' };
    } else if (taskLower.includes('design') || taskLower.includes('image') || taskLower.includes('logo') || taskLower.includes('visual')) {
      return { agent: 'Visual Designer', category: 'Design', page: '/VisualDesigner' };
    } else if (taskLower.includes('caption') || taskLower.includes('write') || taskLower.includes('blog')) {
      return { agent: 'Caption Writer', category: 'Content Creation', page: '/CaptionWriter' };
    } else if (taskLower.includes('hashtag') || taskLower.includes('reach') || taskLower.includes('tags')) {
      return { agent: 'Hashtag Optimizer', category: 'Marketing', page: '/HashtagOptimizer' };
    } else if (taskLower.includes('schedule') || taskLower.includes('calendar') || taskLower.includes('plan')) {
      return { agent: 'Scheduler Assistant', category: 'Planning', page: '/SchedulerAssistant' };
    } else if (taskLower.includes('analytics') || taskLower.includes('performance') || taskLower.includes('metrics')) {
      return { agent: 'Analytics Insights', category: 'Analytics', page: '/AnalyticsInsights' };
    } else if (taskLower.includes('trend') || taskLower.includes('trending') || taskLower.includes('real-time')) {
      return { agent: 'Trend Monitor', category: 'Marketing', page: '/TrendMonitor' };
    } else if (taskLower.includes('competitor') || taskLower.includes('analyze') || taskLower.includes('competition')) {
      return { agent: 'Competitor Intel', category: 'Strategy', page: '/CompetitorIntel' };
    } else if (taskLower.includes('workflow') || taskLower.includes('automate') || taskLower.includes('chain')) {
      return { agent: 'Workflow Builder', category: 'Development', page: '/WorkflowBuilder' };
    } else if (taskLower.includes('talk') || taskLower.includes('meeting') || taskLower.includes('call')) {
      return { agent: 'Manual', category: 'Communication', page: null };
    }
    
    return { agent: 'Manual', category: 'General', page: null };
  };

  const processTasks = () => {
    const tasks = taskInput.split('\n').filter(task => task.trim() !== '');
    
    if (tasks.length === 0) {
      alert('Please enter at least one task.');
      return;
    }

    const processed = tasks.map((task, index) => {
      const suggestion = suggestAgentAndCategory(task.replace(/^[-•]\s*/, ''));
      return {
        id: Math.random().toString(36).substr(2, 9),
        task: task.replace(/^[-•]\s*/, ''),
        ...suggestion
      };
    });

    setProcessedTasks(processed);
  };

  const saveTasksToDatabase = async () => {
    if (processedTasks.length === 0) {
      alert('Please organize tasks first');
      return;
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const tasksToSave = processedTasks.map(task => ({
      id: task.id,
      task_description: task.task,
      task_date: today,
      category: task.category,
      suggested_agent: task.agent,
      agent_page: task.page,
      status: 'pending',
      priority: 'medium',
      has_output: true,
      output_count: 1,
    }));

    const dummyOutputs = tasksToSave.map(task => ({
      id: Math.random().toString(36).substr(2, 9),
      task_id: task.id,
      output_type: "social_post",
      content: `This is a dummy social media post content for task: ${task.task_description}`,
      metadata: { platform: "Facebook" },
      is_favorite: false,
      quality_rating: 0,
      used_in_production: false,
      published_date: null,
    }));

    const existingOutputs = JSON.parse(localStorage.getItem('taskOutputs') || '[]');
    const newOutputs = [...existingOutputs, ...dummyOutputs];
    localStorage.setItem('taskOutputs', JSON.stringify(newOutputs));

    const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const newTasks = [...existingTasks, ...tasksToSave];
    localStorage.setItem('tasks', JSON.stringify(newTasks));
    setProcessedTasks([]);
    setTaskInput("");
    loadSavedTasks();
    setActiveTab("today");
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Daily Task Helper
          </h1>
          <p className="text-lg text-slate-600">
            Organize, track, and complete your tasks with AI-powered assistance
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mx-auto">
            <TabsTrigger value="add" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Tasks
            </TabsTrigger>
            <TabsTrigger value="today" className="gap-2">
              <Calendar className="w-4 h-4" />
              Today
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart2 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-6">
            <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Enter Your Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="Enter your tasks for the day, one per line...

For example:
- Write a blog post about the future of AI
- Create a new design for the company website
- Schedule social media posts for next week
- Analyze competitor's marketing strategy
- Generate hashtags for our new product launch"
                  rows={10}
                  className="mb-4 font-mono"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={processTasks}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                    size="lg"
                  >
                    <Sparkles className="w-5 h-5" />
                    Organize My Tasks
                  </Button>
                </div>
              </CardContent>
            </Card>

            {processedTasks.length > 0 && (
              <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Suggested AI Agents ({processedTasks.length} tasks)</span>
                    <Badge variant="outline" className="text-lg">
                      {processedTasks.filter(t => t.agent !== 'Manual').length} automated
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left p-4 font-semibold text-slate-700">Task</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Category</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Suggested Agent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedTasks.map((taskItem) => {
                          const AgentIcon = agentIcons[taskItem.agent] || FileText;
                          
                          return (
                            <tr key={taskItem.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <p className="text-slate-800">{taskItem.task}</p>
                              </td>
                              <td className="p-4">
                                <Badge className={`${categoryColors[taskItem.category]} border`}>
                                  {taskItem.category}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className={`p-2 rounded-lg ${agentColors[taskItem.agent]}`}>
                                    <AgentIcon className="w-4 h-4" />
                                  </div>
                                  <span className="font-medium text-slate-800">{taskItem.agent}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Button
                    onClick={saveTasksToDatabase}
                    className="w-full bg-green-600 hover:bg-green-700 gap-2"
                    size="lg"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Save Tasks to Today's List
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="today">
            <TaskManagementDashboard 
              tasks={savedTasks} 
              onTaskUpdate={loadSavedTasks}
              agentIcons={agentIcons}
              agentColors={agentColors}
              categoryColors={categoryColors}
              filterDate="today"
            />
          </TabsContent>

          <TabsContent value="dashboard">
            <TaskManagementDashboard 
              tasks={savedTasks} 
              onTaskUpdate={loadSavedTasks}
              agentIcons={agentIcons}
              agentColors={agentColors}
              categoryColors={categoryColors}
              filterDate="all"
              showStats={true}
            />
          </TabsContent>

          <TabsContent value="history">
            <TaskHistory 
              tasks={savedTasks}
              agentIcons={agentIcons}
              agentColors={agentColors}
              categoryColors={categoryColors}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}