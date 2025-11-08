"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  CheckCircle,
  Clock,
  XCircle,
  PlayCircle,
  Calendar,
  Search,
  TrendingUp,
  Zap,
  FileText
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export default function TaskHistory({ tasks, agentIcons, agentColors, categoryColors }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "this_week":
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case "this_month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "last_7_days":
        const last7 = new Date();
        last7.setDate(last7.getDate() - 7);
        return { start: last7, end: now };
      case "last_30_days":
        const last30 = new Date();
        last30.setDate(last30.getDate() - 30);
        return { start: last30, end: now };
      default:
        return null;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchTerm === "" || 
      task.task_description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    
    const matchesAgent = agentFilter === "all" || task.suggested_agent === agentFilter;
    
    let matchesDate = true;
    if (dateRange !== "all") {
      const range = getDateRange();
      if (range) {
        const taskDate = new Date(task.task_date);
        matchesDate = isWithinInterval(taskDate, { start: range.start, end: range.end });
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate && matchesAgent;
  });

  const groupedByDate = filteredTasks.reduce((acc, task) => {
    const date = format(new Date(task.task_date), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(task);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const statusIcons = {
    pending: Clock,
    in_progress: PlayCircle,
    completed: CheckCircle,
    cancelled: XCircle
  };

  const totalTasks = filteredTasks.length;
  const completedCount = filteredTasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const aiUsedCount = filteredTasks.filter(t => t.agent_used).length;

  // Get unique agents for filter
  const uniqueAgents = [...new Set(tasks.map(t => t.suggested_agent))].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-slate-900">{totalTasks}</p>
              </div>
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-purple-600">{completionRate}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">AI Assisted</p>
                <p className="text-3xl font-bold text-blue-600">{aiUsedCount}</p>
              </div>
              <Zap className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader>
          <CardTitle>Task History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 flex-wrap">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {sortedDates.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks found</h3>
              <p className="text-slate-500">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map(date => {
                const tasksForDate = groupedByDate[date];
                const dateObj = new Date(date);
                
                return (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <h3 className="font-semibold text-slate-900">
                        {format(dateObj, 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <Badge variant="outline">{tasksForDate.length} tasks</Badge>
                    </div>

                    <div className="space-y-2 pl-8">
                      {tasksForDate.map(task => {
                        const AgentIcon = agentIcons[task.suggested_agent] || FileText;
                        const StatusIcon = statusIcons[task.status];
                        
                        return (
                          <div
                            key={task.id}
                            className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <p className={`text-slate-900 font-medium flex-1 ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                                {task.task_description}
                              </p>
                              <Badge className={statusColors[task.status]}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={`${categoryColors[task.category]} border`}>
                                {task.category}
                              </Badge>
                              <div className="flex items-center gap-1.5">
                                <div className={`p-1 rounded ${agentColors[task.suggested_agent]}`}>
                                  <AgentIcon className="w-3 h-3" />
                                </div>
                                <span className="text-xs text-slate-600">{task.suggested_agent}</span>
                              </div>
                              {task.agent_used && (
                                <Badge className="bg-purple-100 text-purple-800 text-xs">
                                  <Zap className="w-3 h-3 mr-1" />
                                  AI Used
                                </Badge>
                              )}
                              {task.completion_date && (
                                <span className="text-xs text-slate-500">
                                  Completed: {format(new Date(task.completion_date), 'HH:mm')}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
