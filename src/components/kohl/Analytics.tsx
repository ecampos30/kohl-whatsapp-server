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
          <h2 className="text-lg font-semibold text-gray-900">Relatorios e Metricas</h2>
          <p className="text-sm text-gray-500 mt-0.5">Acompanhe desempenho e engajamento</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedConnection}
            onChange={(e) => setSelectedConnection(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          >
            <option value="all">Todos os numeros</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>{conn.name}</option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          >
            <option value="7days">Ultimos 7 dias</option>
            <option value="30days">Ultimos 30 dias</option>
            <option value="90days">Ultimos 90 dias</option>
          </select>

          <button className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: MessageSquare, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', label: 'Mensagens', sub: 'Total enviadas', value: mockData.messages.sent.toLocaleString(), trend: '+12%' },
          { icon: Users, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', label: 'Novos Leads', sub: 'Neste periodo', value: mockData.leads.new, trend: '+8%' },
          { icon: Target, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', label: 'Taxa de Conv.', sub: 'Lead → Matricula', value: `${mockData.leads.conversionRate}%`, trend: '+2.1%' },
          { icon: TrendingUp, iconBg: 'bg-rose-50', iconColor: 'text-rose-600', label: 'Satisfacao IA', sub: 'Nota media', value: `${mockData.aiPerformance.satisfaction}/5.0`, trend: '+0.3' },
        ].map(({ icon: Icon, iconBg, iconColor, label, sub, value, trend }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-1">{value}</div>
            <div className="text-xs text-emerald-600 font-medium">{trend} vs periodo anterior</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Atividade Diaria</h3>
          
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
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Interesse por Curso</h3>
          
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
                      className="bg-rose-500 h-2 rounded-full"
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
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Performance do Assistente de IA</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: mockData.aiPerformance.handled, label: 'Atendidas pela IA', sub: `${((mockData.aiPerformance.handled / (mockData.aiPerformance.handled + mockData.aiPerformance.escalated)) * 100).toFixed(1)}% de sucesso`, color: 'text-emerald-600' },
            { value: mockData.aiPerformance.escalated, label: 'Escaladas', sub: `${((mockData.aiPerformance.escalated / (mockData.aiPerformance.handled + mockData.aiPerformance.escalated)) * 100).toFixed(1)}% do total`, color: 'text-amber-600' },
            { value: mockData.aiPerformance.satisfaction, label: 'Satisfacao Media', sub: 'De 5.0 estrelas', color: 'text-blue-600' },
            { value: `${mockData.aiPerformance.avgResponseTime}s`, label: 'Resposta Media', sub: 'Somente IA', color: 'text-gray-900' },
          ].map(({ value, label, sub, color }) => (
            <div key={label} className="border border-gray-100 rounded-lg p-4 text-center">
              <div className={`text-2xl font-semibold ${color} mb-1`}>{value}</div>
              <div className="text-xs font-medium text-gray-700">{label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}