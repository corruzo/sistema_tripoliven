import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const getLocalDateStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Gráfico 1: Torta/Donut de Distribución por Producto en Canvas (Alta Resolución 2x)
const generateDonutChartImage = (dispatches, totalQuantity) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 560;
  const ctx = canvas.getContext('2d');

  // Fondo blanco inmaculado
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Borde sutil 2x
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  // Título
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Participación por Producto (TM)', 32, 52);

  const productDistribution = dispatches.reduce((acc, d) => {
    if (d.status === 'Anulado') return acc;
    const p = d.product_type || d.product_name || 'Otros';
    acc[p] = Math.round(((acc[p] || 0) + Number(d.quantity_tm || 0)) * 1000) / 1000;
    return acc;
  }, {});

  const distributionArray = Object.keys(productDistribution)
    .map(key => ({ name: key, value: productDistribution[key] }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  if (distributionArray.length === 0 || totalQuantity === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 24px "Segoe UI"';
    ctx.fillText('Sin datos para graficar', canvas.width / 2 - 120, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  // Paleta del Sistema (Índigo, Azul Real, Esmeralda, Cian, Violeta - CERO ROJO)
  const colors = {
    'Tripolifosfato': '#3b82f6', // Azul Real
    'Ácido Fosfórico': '#10b981', // Esmeralda
    'Pirofosfato': '#8b5cf6', // Violeta
    'Otros': '#06b6d4' // Cian
  };
  const defaultColors = ['#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#6366f1', '#ec4899'];

  const centerX = 280;
  const centerY = 310;
  const outerRadius = 160;
  const innerRadius = 90;

  let currentAngle = -0.5 * Math.PI;

  distributionArray.forEach((item, index) => {
    const sliceAngle = (item.value / totalQuantity) * 2 * Math.PI;
    const color = colors[item.name] || defaultColors[index % defaultColors.length];

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
    ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.stroke();

    currentAngle += sliceAngle;
  });

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 36px "Segoe UI"';
  ctx.textAlign = 'center';
  ctx.fillText(totalQuantity.toFixed(1), centerX, centerY + 10);
  
  ctx.fillStyle = '#64748b';
  ctx.font = '20px "Segoe UI"';
  ctx.fillText('TM Totales', centerX, centerY + 38);

  // Leyenda a la derecha con letras más grandes y definidas
  ctx.textAlign = 'left';
  distributionArray.forEach((item, index) => {
    const y = 130 + index * 64;
    const color = colors[item.name] || defaultColors[index % defaultColors.length];
    const percent = (item.value / totalQuantity) * 100;

    ctx.fillStyle = color;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(520, y, 28, 28, 6);
    else ctx.rect(520, y, 28, 28);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px "Segoe UI"';
    ctx.fillText(item.name, 568, y + 22);

    ctx.fillStyle = '#64748b';
    ctx.font = '22px "Segoe UI"';
    ctx.fillText(`${percent.toFixed(1)}% (${item.value.toFixed(2)} tm)`, 568, y + 50);
  });

  return canvas.toDataURL('image/png');
};

// Gráfico 2: Barras Horizontales de Distribución Geográfica (Alta Resolución 2x)
const generateStateBarChartImage = (dispatches, totalQuantity) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 560;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Distribución Geográfica (Top Destinos)', 32, 52);

  const destinationDistribution = dispatches.reduce((acc, d) => {
    const state = d.destination_state || d.destination_location;
    if (!state || d.status === 'Anulado') return acc;
    acc[state] = Math.round(((acc[state] || 0) + Number(d.quantity_tm || 0)) * 1000) / 1000;
    return acc;
  }, {});
  
  const destinationsArray = Object.keys(destinationDistribution)
    .map(key => ({ name: key, value: destinationDistribution[key] }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); 

  if (destinationsArray.length === 0 || totalQuantity === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 24px "Segoe UI"';
    ctx.fillText('Sin datos geográficos para graficar', canvas.width / 2 - 160, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  const maxVal = Math.max(...destinationsArray.map(d => d.value), 1);
  const startY = 110;
  const barHeight = 32;
  const gap = 64;
  const maxBarWidth = 480;

  destinationsArray.forEach((dest, idx) => {
    const y = startY + (idx * gap);
    const percent = (dest.value / maxVal);
    const barWidth = percent * maxBarWidth;
    const totalPercent = totalQuantity > 0 ? ((dest.value / totalQuantity) * 100).toFixed(1) : '0';

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 23px "Segoe UI"';
    ctx.textAlign = 'right';
    ctx.fillText(`${idx + 1}. ${dest.name}`, 230, y + 24);

    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(250, y, maxBarWidth, barHeight, 8);
    else ctx.rect(250, y, maxBarWidth, barHeight);
    ctx.fill();

    // Gradiente en tonos del sistema (Azul a Índigo - CERO ROJO)
    const grad = ctx.createLinearGradient(250, y, 250 + barWidth, y);
    grad.addColorStop(0, '#3b82f6'); // Azul Real
    grad.addColorStop(1, '#4f46e5'); // Índigo Ejecutivo

    ctx.fillStyle = grad;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(250, y, Math.max(barWidth, 8), barHeight, 8);
    else ctx.rect(250, y, barWidth, barHeight);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px "Segoe UI"';
    ctx.textAlign = 'left';
    ctx.fillText(`${dest.value.toFixed(2)} tm`, 264 + maxBarWidth, y + 24);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '20px "Segoe UI"';
    ctx.fillText(`(${totalPercent}%)`, 380 + maxBarWidth, y + 24);
  });

  return canvas.toDataURL('image/png');
};

// Generador y Exportador Principal a PDF (Estricto, Corporativo y Limpio)
export const exportDispatchesToPDF = (dispatches, startDate, endDate, totalQuantity, activeFilters = null) => {
  if (!dispatches || dispatches.length === 0) {
    alert('No hay datos disponibles para exportar en este periodo.');
    return;
  }

  try {
    // Crear documento PDF en formato A4 vertical
    const doc = new jsPDF('p', 'mm', 'a4');

    // ==========================================
    // ENCABEZADO CORPORATIVO BÁSICO (TRIPOLIVEN)
    // ==========================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42); // Gris muy oscuro / Negro
    doc.text('TRIPOLIVEN C.A.', 14, 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139); // Gris sobrio
    doc.text('RIF: J-00045211-9   |   Planta Operativa: Zona Industrial Morón, Edo. Carabobo, Venezuela', 14, 28);

    // Línea separadora limpia
    doc.setLineWidth(0.5);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 32, 196, 32);

    // Subtítulo del Reporte
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('REPORTE GENERAL DE DESPACHOS Y LOGÍSTICA', 14, 40);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Periodo: ${startDate || 'Inicio'} al ${endDate || 'Hoy'}      |      Fecha Emisión: ${getLocalDateStr()}`, 14, 46);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Azul del sistema
    doc.text(`Volumen Total Despachado: ${totalQuantity.toFixed(2)} TM`, 196, 46, { align: 'right' });

    // Determinar si hay filtros activos y armar descripción
    let hasFilters = false;
    let filterText = '';
    let chartY = 52;
    let tableStartY = 108;

    if (activeFilters) {
      const filters = [];
      if (activeFilters.productType && activeFilters.productType !== 'Todos') {
        filters.push(`Producto: ${activeFilters.productType}`);
      }
      if (activeFilters.client && activeFilters.client !== 'Todos') {
        filters.push(`Cliente: ${activeFilters.client}`);
      }
      if (activeFilters.status && activeFilters.status !== 'Todos') {
        filters.push(`Estatus: ${activeFilters.status}`);
      }
      if (activeFilters.searchQuery && activeFilters.searchQuery.trim() !== '') {
        filters.push(`Búsqueda: "${activeFilters.searchQuery}"`);
      }

      if (filters.length > 0) {
        hasFilters = true;
        filterText = `Filtros activos: ${filters.join('  |  ')}`;
        chartY = 58;
        tableStartY = 114;
      }
    }

    if (hasFilters) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(120, 130, 140);
      doc.text(filterText, 14, 52);
    }

    // ==========================================
    // INCRUSTACIÓN DE GRÁFICOS (CERO ROJO)
    // ==========================================
    try {
      const donutBase64 = generateDonutChartImage(dispatches, totalQuantity);
      const stateBase64 = generateStateBarChartImage(dispatches, totalQuantity);

      // Posicionar gráficos lado a lado (Ancho 88mm cada uno con 6mm de separación)
      doc.addImage(donutBase64, 'PNG', 14, chartY, 88, 48);
      doc.addImage(stateBase64, 'PNG', 108, chartY, 88, 48);
    } catch (err) {
      console.error('Error al generar e incrustar gráficos en PDF:', err);
    }

    // ==========================================
    // TABLA DE REGISTROS (jspdf-autotable)
    // ==========================================
    const tableHeaders = ['Nº Orden', 'Cliente Corporativo', 'Línea de Producto', 'Cant (TM)', 'Destino', 'Fecha Salida'];
    const tableRows = dispatches.map(d => {
      const pType = d.product_type || d.product_name || '-';
      const dState = d.destination_state || d.destination_location || '-';
      const dateStr = d.dispatch_datetime ? String(d.dispatch_datetime).split('T')[0] : (d.dispatch_date ? String(d.dispatch_date).split('T')[0] : '-');

      return [
        d.order_number || '-',
        d.client_name || '-',
        pType,
        Number(d.quantity_tm || 0).toFixed(2),
        dState,
        dateStr
      ];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 4,
        textColor: [51, 65, 85]
      },
      headStyles: {
        fillColor: [37, 99, 235], // Azul Moderno del Sistema
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Gris ultra suave
      },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 54 },
        2: { cellWidth: 36 },
        3: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 24 },
        4: { cellWidth: 30 },
        5: { halign: 'center', cellWidth: 22 }
      }
    });

    // ==========================================
    // MARCA DE AGUA Y CERTIFICACIÓN DE PÁGINA (VIVE FLOW DEV)
    // ==========================================
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Marca de agua central ultra-suave y elegante
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(243, 244, 246); // Gris hielo casi imperceptible
      
      doc.text('SISTEMA DESARROLLADO POR VIVE FLOW DEV', 105, 140, {
        align: 'center',
        angle: 315
      });
      doc.text('TRIPOLIERP ENTERPRISE SOLUTION', 105, 152, {
        align: 'center',
        angle: 315
      });

      // Pie de página institucional sutil
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(160, 174, 192);
      doc.text('TripoliERP  |  Certificado y Desarrollado por Vive flow dev', 14, 287);
      doc.text(`Página ${i} de ${pageCount}`, 196, 287, { align: 'right' });
    }

    // Guardar y descargar PDF
    const dateStr = getLocalDateStr();
    doc.save(`TripoliERP_Reporte_Operaciones_${dateStr}.pdf`);
  } catch (mainErr) {
    console.error('Error fatal exportando a PDF:', mainErr);
    alert('Ocurrió un error al generar el PDF. Revisa la consola para más detalles.');
  }
};
