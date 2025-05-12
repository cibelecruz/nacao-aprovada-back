interface userData{
    name: string
    email: string
    percentageCompleted: number
    weeksCompleted: number
    totalStudyHours: number
    consecutiveDays: number
    emblems: {
      userLevel: string
      userFrequency: string
      userDedication: string
    },
    questionsPerformance: number
    averageTimePerDay: string
}

export function emailMensage(user:userData){
    return `
          <!DOCTYPE html>
          <html lang="pt-BR">
    
          <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Relatório de Desempenho</title>
          </head>
    
          <body style="font-family: system-ui, -apple-system, sans-serif; background-color: #04070b; color: #ffffff; line-height: 1.5; padding: 1rem;">
              <div style="margin: 0 auto; background-color: #070E17; padding: 20px; border-radius: 15px;">
                  <header style="margin-bottom: 2rem;">
                      <h1 style="color: #ffa726; font-size: 2rem; margin-bottom: 1rem;">Relatório de Desempenho</h1>
                      <p style="color: #a1a1a1; font-size: 1.1rem;">Olá, ${user.name}! Esperamos que você esteja bem. Aqui está o seu relatório de desempenho para ajudá-lo a acompanhar o progresso dos seus estudos:</p>
                  </header>
    
                  <div style="margin-bottom: 2rem;">
                      <div style="background-color: #141b2d; padding: 1.5rem; border-radius: 12px; transition: transform 0.2s ease; margin-bottom: 1rem;">
                          <h3 style="color: #ffa726; margin-bottom: 1rem; font-size: 1.1rem;">Concurseiro nível</h3>
                          <p style="font-size: 1.2rem;">${user.emblems.userLevel}</p>
                      </div>
                      <div style="background-color: #141b2d; padding: 1.5rem; border-radius: 12px; transition: transform 0.2s ease; margin-bottom: 1rem;">
                          <h3 style="color: #ffa726; margin-bottom: 1rem; font-size: 1.1rem;">Frequência</h3>
                          <p style="font-size: 1.2rem;">${user.emblems.userFrequency}</p>
                      </div>
                      <div style="background-color: #141b2d; padding: 1.5rem; border-radius: 12px; transition: transform 0.2s ease; margin-bottom: 1rem;">
                          <h3 style="color: #ffa726; margin-bottom: 1rem; font-size: 1.1rem;">Dedicação</h3>
                          <p style="font-size: 1.2rem;">${user.emblems.userDedication}</p>
                      </div>
                      <div style="background-color: #141b2d; padding: 1.5rem; border-radius: 12px; transition: transform 0.2s ease; margin-bottom: 1rem;">
                          <h3 style="color: #ffa726; margin-bottom: 1rem; font-size: 1.1rem;">Comprometimento</h3>
                          <p style="font-size: 1.2rem;">-</p>
                      </div>
                  </div>
    
                  <div style="margin-bottom: 2rem;">
                      <div style="background-color: #141b2d; padding: 1.5rem; border-radius: 12px; text-align: center; margin-bottom: 1rem;">
                          <div style="font-size: 2.5rem; font-weight: bold; color: #ffa726; margin-bottom: 0.5rem;">0</div>
                          <div style="color: #a1a1a1; font-size: 0.9rem;">Assuntos revisados</div>
                      </div>
                      <div style="background-color: #141b2d; padding: 1.5rem; border-radius: 12px; text-align: center; margin-bottom: 1rem;">
                          <div style="font-size: 2.5rem; font-weight: bold; color: #ffa726; margin-bottom: 0.5rem;">${user.consecutiveDays}</div>
                          <div style="color: #a1a1a1; font-size: 0.9rem;">Metas Diárias Seguidas</div>
                      </div>
                      <div style="background-color: #141b2d; padding: 1.5rem; border-radius: 12px; text-align: center; margin-bottom: 1rem;">
                          <div style="font-size: 2.5rem; font-weight: bold; color: #ffa726; margin-bottom: 0.5rem;">${user.weeksCompleted}</div>
                          <div style="color: #a1a1a1; font-size: 0.9rem;">Metas Semanais Concluídas</div>
                      </div>
                      <div style="background-color: #141b2d; padding: 1.5rem; border-radius: 12px; text-align: center; margin-bottom: 1rem;">
                          <div style="font-size: 2.5rem; font-weight: bold; color: #ffa726; margin-bottom: 0.5rem;">${user.totalStudyHours.toFixed(2)}</div>
                          <div style="color: #a1a1a1; font-size: 0.9rem;">Horas Totais de Estudo</div>
                      </div>
                  </div>
    
                  <div style="margin-bottom: 2rem;">
                      <div style="background-color: #141b2d; padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
                          <h3 style="color: #ffa726; margin-bottom: 1rem;">Frequência</h3>
                          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">Seu tempo semanal está muito baixo</div>
                          <div style="color: #a1a1a1; font-size: 0.9rem;">Média diária: ${user.averageTimePerDay}</div>
                      </div>
                      <div style="background-color: #141b2d; padding: 1.5rem; border-radius: 12px; margin-bottom: 1rem;">
                          <h3 style="color: #ffa726; margin-bottom: 1rem;">Índice de acerto</h3>
                          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">${(user.questionsPerformance * 100).toFixed(2)}%</div>
                      </div>
                      <div style="background-color: #141b2d; padding: 1.5rem; border-radius: 12px;margin-bottom: 1rem;">
                          <h3 style="color: #ffa726; margin-bottom: 1rem;">Edital</h3>
                          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">${user.percentageCompleted.toFixed(2) || 0.00}% estudado</div>
                      </div>
                  </div>
              </div>
          </body>
    
          </html>
    `;
}
