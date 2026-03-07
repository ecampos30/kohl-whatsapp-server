import React, { useState } from 'react';
import { Calendar, TrendingUp, MessageSquare, Users, Target, Download } from 'lucide-react';
import { WhatsAppConnection } from '../../types/kohl-system';

interface AnalyticsProps {
  connections: WhatsAppConnection[];
}

export function Analytics({ connections }: AnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [selectedConnection, setSelectedConnection] = useState('all');

  // Mock data - in real implementation, this would come from your analytics service
  const mockData = {
    messages: {
      sent: 1247,
      received: 892,
      automated: 756,
      manual: 136
    },
    leads: {
      new: 45,
      qualified: 23,
      converted: 8,
      conversionRate: 17.8
    },
    courses: {
      inquiries: {
        'microblading': 156,
        'nanoblading': 89,
        'bb-glow': 67,
        'dual-nano-micro': 45,
        'nanolips': 34
      },
      enrollments: {
        'microblading': 12,
        'nanoblading': 8,
        'bb-glow': 5,
        'dual-nano-micro': 3,
        'nanolips': 2
      }
    },
    aiPerformance: {
      handled: 623,
      escalated: 133,
      satisfaction: 4.2,
      avgResponseTime: 2.3
    }
  };

  const chartData = [
    { day: 'Mon', messages: 180, leads: 8 },
    { day: 'Tue', messages: 165, leads: 6 },
    { day: 'Wed', messages: 195, leads: 9 },
    { day: 'Thu', messages: 210, leads: 12 },
    { day: 'Fri', messages: 225, leads: 15 },
    { day: 'Sat', messages: 145, leads: 7 },
    { day: 'Sun', messages: 127, leads: 5 }
  ];

  const maxMessages = Math.max(...chartData.map(d => d.messages));
  const maxLeads = Math.max(...chartData.map(d => d.leads));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Track performance and engagement metrics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedConnection}
            onChange={(e) => setSelectedConnection(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Numbers</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name}
              </option>
            ))}
          </select>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
          
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Messages</h3>
              <p className="text-sm text-gray-600">Total sent</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">{mockData.messages.sent.toLocaleString()}</div>
          <div className="text-sm text-green-600">+12% vs last period</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">New Leads</h3>
              <p className="text-sm text-gray-600">This period</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">{mockData.leads.new}</div>
          <div className="text-sm text-green-600">+8% vs last period</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Conversion Rate</h3>
              <p className="text-sm text-gray-600">Lead to enrollment</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">{mockData.leads.conversionRate}%</div>
          <div className="text-sm text-green-600">+2.1% vs last period</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">AI Satisfaction</h3>
              <p className="text-sm text-gray-600">Average rating</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-2">{mockData.aiPerformance.satisfaction}/5.0</div>
          <div className="text-sm text-green-600">+0.3 vs last period</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Atividade Diária</h3>
          
          <div className="flex items-end space-x-2 h-64 mb-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col space-y-1 mb-2">
                  <div 
                    className="bg-blue-600 rounded-t"
                    style={{ 
                      height: `${(item.messages / maxMessages) * 180}px`,
                      minHeight: '4px'
                    }}
                    title={`${item.messages} messages`}
                  />
                  <div 
                    className="bg-green-600 rounded-b"
                    style={{ 
                      height: `${(item.leads / maxLeads) * 60}px`,
                      minHeight: '4px'
                    }}
                    title={`${item.leads} leads`}
                  />
                </div>
                <span className="text-xs text-gray-600">{item.day}</span>
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span className="text-sm text-gray-600">Mensagens</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-600 rounded"></div>
              <span className="text-sm text-gray-600">Novos Leads</span>
            </div>
          </div>
        </div>

        {/* Course Interest */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Interesse por Cursos</h3>
          
          <div className="space-y-4">
            {Object.entries(mockData.courses.inquiries).map(([courseId, inquiries]) => {
              const enrollments = mockData.courses.enrollments[courseId] || 0;
              const conversionRate = ((enrollments / inquiries) * 100).toFixed(1);
              
              return (
                <div key={courseId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {courseId.replace('-', ' ')}
                    </span>
                    <div className="text-sm text-gray-600">
                      {inquiries} consultas • {enrollments} matriculados ({conversionRate}%)
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-purple-600 h-2 rounded-full"
                      style={{ width: `${(inquiries / Math.max(...Object.values(mockData.courses.inquiries))) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Performance */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance do Assistente de IA</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{mockData.aiPerformance.handled}</div>
            <div className="text-sm text-gray-600">Mensagens Atendidas</div>
            <div className="text-xs text-gray-500 mt-1">
              {((mockData.aiPerformance.handled / (mockData.aiPerformance.handled + mockData.aiPerformance.escalated)) * 100).toFixed(1)}% taxa de sucesso
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">{mockData.aiPerformance.escalated}</div>
            <div className="text-sm text-gray-600">Escalado para Humano</div>
            <div className="text-xs text-gray-500 mt-1">
              {((mockData.aiPerformance.escalated / (mockData.aiPerformance.handled + mockData.aiPerformance.escalated)) * 100).toFixed(1)}% taxa de escalação
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{mockData.aiPerformance.satisfaction}</div>
            <div className="text-sm text-gray-600">Satisfação Média</div>
            <div className="text-xs text-gray-500 mt-1">De 5.0 estrelas</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">{mockData.aiPerformance.avgResponseTime}s</div>
            <div className="text-sm text-gray-600">Tempo Médio de Resposta</div>
            <div className="text-xs text-gray-500 mt-1">Apenas respostas da IA</div>
          </div>
        </div>
      </div>
    </div>
  );
}