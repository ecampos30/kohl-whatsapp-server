import React from 'react';

export function MetricsChart() {
  const data = [
    { day: 'Seg', messages: 1200, responses: 890 },
    { day: 'Ter', messages: 1450, responses: 1100 },
    { day: 'Qua', messages: 1300, responses: 950 },
    { day: 'Qui', messages: 1600, responses: 1250 },
    { day: 'Sex', messages: 1800, responses: 1400 },
    { day: 'Sáb', messages: 900, responses: 650 },
    { day: 'Dom', messages: 600, responses: 420 },
  ];

  const maxValue = Math.max(...data.map(d => d.messages));

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-6">Mensagens por Dia</h3>
      
      <div className="flex items-end space-x-2 h-64">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col space-y-1 mb-2">
              <div 
                className="bg-blue-600 rounded-t"
                style={{ 
                  height: `${(item.messages / maxValue) * 200}px`,
                  minHeight: '4px'
                }}
                title={`${item.messages} mensagens enviadas`}
              />
              <div 
                className="bg-blue-300 rounded-b"
                style={{ 
                  height: `${(item.responses / maxValue) * 200}px`,
                  minHeight: '4px'
                }}
                title={`${item.responses} respostas recebidas`}
              />
            </div>
            <span className="text-xs text-gray-600">{item.day}</span>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded"></div>
          <span className="text-sm text-gray-600">Enviadas</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-300 rounded"></div>
          <span className="text-sm text-gray-600">Respostas</span>
        </div>
      </div>
    </div>
  );
}