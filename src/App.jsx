import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  Check,
  Clock,
  Truck,
  MapPin,
  AlertCircle,
  Save,
  Upload,
  Download,
  Filter,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";

const TruckLoadingPlanner = () => {
  const [sideType, setSideType] = useState("3");
  const [trucks, setTrucks] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [formData, setFormData] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filterEstado, setFilterEstado] = useState("all");
  const [isLoadingFromWeb, setIsLoadingFromWeb] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getEmptyTruck = () => {
    const base = {
      id: nextId,
      transportista: "",
      destino: "",
      observaciones: "",
      estado: "pending",
    };

    if (sideType === "2") {
      return { ...base, llegada: "", salida: "", remolque: "" };
    } else if (sideType === "3") {
      return {
        ...base,
        matricula: "",
        muelle: "",
        estadoMuelle: "",
        llegada: "",
        salida: "",
        salidaTope: "",
        fuera: "",
      };
    } else {
      return {
        ...base,
        matricula: "",
        muelle: "",
        estadoMuelle: "",
        llegada: "",
        salidaTope: "",
        fuera: "",
      };
    }
  };

  const openDialog = (truck = null) => {
    if (truck) {
      setEditingTruck(truck);
      setFormData(truck);
    } else {
      setEditingTruck(null);
      setFormData(getEmptyTruck());
    }
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingTruck(null);
    setFormData({});
  };

  const handleSave = () => {
    if (!formData.transportista || !formData.destino) {
      alert("Por favor, completa al menos el Transportista y el Destino");
      return;
    }

    if (editingTruck) {
      setTrucks(trucks.map((t) => (t.id === editingTruck.id ? formData : t)));
      showSuccess("Camión actualizado");
    } else {
      setTrucks([...trucks, { ...formData, id: nextId, estado: "pending" }]);
      setNextId(nextId + 1);
      showSuccess("Camión añadido");
    }
    closeDialog();
  };

  const acceptTruck = (id) => {
    setTrucks(
      trucks.map((t) => (t.id === id ? { ...t, estado: "accepted" } : t))
    );
    showSuccess("Camión aceptado");
  };

  const deleteTruck = (id) => {
    if (window.confirm("¿Eliminar este camión?")) {
      setTrucks(trucks.filter((t) => t.id !== id));
      showSuccess("Camión eliminado");
    }
  };

  const formatTime = (value) => {
    if (!value) return "";
    const num = value.replace(/[^0-9]/g, "");
    if (num.length >= 2) {
      const hours = num.slice(0, 2);
      const minutes = num.slice(2, 4);
      return `${hours}${minutes ? ":" + minutes : ""}`;
    }
    return num;
  };

  const parseExcelTime = (excelTime) => {
    if (!excelTime) return "";
    if (typeof excelTime === "string") return excelTime;

    // Excel guarda las horas como fracciones de día (0.5 = 12:00)
    const totalMinutes = Math.round(excelTime * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const showSuccess = (message) => {
    setShowSuccessMessage(message);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const exportToJSON = () => {
    const data = {
      sideType,
      fecha: new Date().toLocaleDateString("es-ES"),
      trucks,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reunion-lado-${sideType}-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    showSuccess("JSON descargado");
  };

  const exportToCSV = () => {
    let headers, rows;
    if (sideType === "2") {
      headers = "TRANSPORTISTA,DESTINO,LLEGADA,SALIDA,REMOLQUE,OBSERVACIONES";
      rows = trucks
        .map(
          (t) =>
            `"${t.transportista}","${t.destino}","${t.llegada}","${t.salida}","${t.remolque}","${t.observaciones}"`
        )
        .join("\n");
    } else if (sideType === "3") {
      headers =
        "TRANSPORTISTA,MATRICULA,MUELLE,ESTADO,DESTINO,LLEGADA,SALIDA,SALIDA TOPE,FUERA,OBSERVACIONES";
      rows = trucks
        .map(
          (t) =>
            `"${t.transportista}","${t.matricula}","${t.muelle}","${t.estadoMuelle}","${t.destino}","${t.llegada}","${t.salida}","${t.salidaTope}","${t.fuera}","${t.observaciones}"`
        )
        .join("\n");
    } else {
      headers =
        "TRANSPORTISTA,MATRICULA,MUELLE,ESTADO,DESTINO,LLEGADA,SALIDA TOPE,FUERA,OBSERVACIONES";
      rows = trucks
        .map(
          (t) =>
            `"${t.transportista}","${t.matricula}","${t.muelle}","${t.estadoMuelle}","${t.destino}","${t.llegada}","${t.salidaTope}","${t.fuera}","${t.observaciones}"`
        )
        .join("\n");
    }
    const csv = `${headers}\n${rows}`;
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reunion-lado-${sideType}-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    showSuccess("CSV descargado");
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.sideType) setSideType(data.sideType);
          if (data.trucks) {
            const maxId = Math.max(...data.trucks.map((t) => t.id), 0);
            setTrucks(data.trucks);
            setNextId(maxId + 1);
            showSuccess("Datos cargados correctamente");
          }
        } catch (error) {
          alert("Error al cargar archivo JSON");
        }
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  const importExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Importar la librería XLSX dinámicamente
      const XLSX = await import(
        "https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs"
      );

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const workbook = XLSX.read(event.target.result, {
            type: "array",
            cellDates: true,
            cellStyles: true,
          });

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
          });

          // Detectar el tipo de lado según la estructura
          let detectedSideType = "3";
          const headers = data[2] || [];

          if (!headers.includes("MATRICULA") && !headers.includes("MUELLE")) {
            detectedSideType = "2";
          } else if (
            headers.includes("SALIDA") &&
            headers.includes("SALIDA TOPE")
          ) {
            detectedSideType = "3";
          } else if (
            !headers.includes("SALIDA") &&
            headers.includes("SALIDA TOPE")
          ) {
            detectedSideType = "4";
          }

          setSideType(detectedSideType);

          // Procesar los datos (saltar las primeras 3 filas: título, "CARGA", headers)
          const importedTrucks = [];
          let currentId = nextId;

          for (let i = 3; i < data.length; i++) {
            const row = data[i];
            if (!row[0]) continue; // Saltar filas vacías

            let truck = {
              id: currentId++,
              estado: "pending",
            };

            if (detectedSideType === "2") {
              // Lado 2: TRANSPORTISTA, DESTINO, MUELLE, LLEGADA, SALIDA, REMOLQUE, OBSERVACIONES
              truck = {
                ...truck,
                transportista: row[0] || "",
                destino: row[1] || "",
                llegada: parseExcelTime(row[3]),
                salida: parseExcelTime(row[4]),
                remolque: row[5] || "",
                observaciones: row[6] || "",
              };
            } else if (detectedSideType === "3") {
              // Lado 3: TRANSPORTISTA, MATRICULA, MUELLE, ESTADO, DESTINO, LLEGADA, SALIDA, SALIDA TOPE, FUERA, OBSERVACIONES
              truck = {
                ...truck,
                transportista: row[0] || "",
                matricula: row[1] || "",
                muelle: row[2] || "",
                estadoMuelle: row[3] || "",
                destino: row[4] || "",
                llegada: parseExcelTime(row[5]),
                salida: parseExcelTime(row[6]),
                salidaTope: parseExcelTime(row[7]),
                fuera: row[8] || "",
                observaciones: row[9] || "",
              };

              // Si tiene estado OK o *, marcarlo como aceptado
              if (row[3] === "OK" || row[3] === "*") {
                truck.estado = "accepted";
              }
            } else {
              // Lado 4: TRANSPORTISTA, MATRICULA, MUELLE, ESTADO, DESTINO, LLEGADA, SALIDA TOPE, FUERA, OBSERVACIONES
              truck = {
                ...truck,
                transportista: row[0] || "",
                matricula: row[1] || "",
                muelle: row[2] || "",
                estadoMuelle: row[3] || "",
                destino: row[4] || "",
                llegada: parseExcelTime(row[5]),
                salidaTope: parseExcelTime(row[6]),
                fuera: row[7] || "",
                observaciones: row[8] || "",
              };

              if (row[3] === "OK" || row[3] === "*") {
                truck.estado = "accepted";
              }
            }

            importedTrucks.push(truck);
          }

          setTrucks(importedTrucks);
          setNextId(currentId);
          showSuccess(
            `${importedTrucks.length} camiones importados desde Excel`
          );
        } catch (error) {
          console.error(error);
          alert(
            "Error al procesar el archivo Excel. Verifica que el formato sea correcto."
          );
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error(error);
      alert("Error al cargar la librería de Excel");
    }

    e.target.value = "";
  };

  const loadFromWeb = async () => {
    setIsLoadingFromWeb(true);

    try {
      // Simular carga desde API/Web - Aquí deberías poner tu endpoint real
      // const response = await fetch('https://tu-api.com/muelles');
      // const data = await response.json();

      // Simulación de datos de ejemplo
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockData = [
        {
          id: nextId,
          transportista: "EWALS",
          matricula: "OV67BZ",
          muelle: "316",
          estadoMuelle: "",
          destino: "PB-ZM-P.EUROPA-RUGBY TF",
          llegada: "21:00",
          salida: "23:00",
          salidaTope: "05:00",
          fuera: "",
          observaciones: "VIENE PB CARGADO / COMPLETA EN P. EUROPA",
          estado: "pending",
        },
        {
          id: nextId + 1,
          transportista: "MARCOTRAN",
          matricula: "",
          muelle: "326",
          estadoMuelle: "",
          destino: "PYSKO",
          llegada: "21:00",
          salida: "23:00",
          salidaTope: "02:00",
          fuera: "",
          observaciones: "LLENO",
          estado: "pending",
        },
      ];

      setTrucks(mockData);
      setNextId(nextId + mockData.length);
      showSuccess("Datos cargados desde la web correctamente");
    } catch (error) {
      alert("Error al cargar datos desde la web. Verifica la conexión.");
      console.error(error);
    } finally {
      setIsLoadingFromWeb(false);
    }
  };

  const getCardBorderColor = (truck) => {
    if (truck.estado === "accepted") return "border-t-green-500";
    if (truck.estadoMuelle === "OK") return "border-t-green-500";
    if (truck.estadoMuelle === "*") return "border-t-yellow-500";
    return "border-t-gray-400";
  };

  const stats = {
    total: trucks.length,
    libres: trucks.filter((t) => t.estado === "pending").length,
    ocupados: trucks.filter((t) => t.estado === "accepted").length,
    incidencias: trucks.filter((t) => t.estadoMuelle === "*").length,
  };

  const filteredTrucks =
    filterEstado === "all"
      ? trucks
      : filterEstado === "accepted"
      ? trucks.filter((t) => t.estado === "accepted")
      : filterEstado === "pending"
      ? trucks.filter((t) => t.estado === "pending")
      : trucks.filter((t) => t.estadoMuelle === "*");

  const TimeInput = ({ value, onChange, placeholder }) => (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(formatTime(e.target.value))}
      placeholder={placeholder}
      maxLength="5"
      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
    />
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Sistema de Gestión de Muelles
            </h1>
            <p className="text-blue-100 text-sm">
              Control en tiempo real del almacén logístico
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">
              {currentTime.toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="text-3xl font-bold font-mono">
              {currentTime.toLocaleTimeString("es-ES")}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm font-semibold">
                  Total Muelles
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  {stats.total}
                </div>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm font-semibold">
                  Libres
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {stats.libres}
                </div>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm font-semibold">
                  Ocupados
                </div>
                <div className="text-3xl font-bold text-red-600">
                  {stats.ocupados}
                </div>
              </div>
              <div className="text-4xl">🚛</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-600 text-sm font-semibold">
                  Incidencias
                </div>
                <div className="text-3xl font-bold text-yellow-600">
                  {stats.incidencias}
                </div>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg shadow">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-green-800 font-semibold">
                {showSuccessMessage}
              </span>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Libres</option>
                <option value="accepted">Ocupados</option>
                <option value="incidencias">Incidencias</option>
              </select>

              <select
                value={sideType}
                onChange={(e) => setSideType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold"
              >
                <option value="2">Lado 2</option>
                <option value="3">Lado 3</option>
                <option value="4">Lado 4</option>
              </select>

              <button
                onClick={() => setFilterEstado("all")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-medium"
              >
                Limpiar Filtros
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-all font-medium flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Importar Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={importExcel}
                  className="hidden"
                />
              </label>

              <button
                onClick={loadFromWeb}
                disabled={isLoadingFromWeb}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium flex items-center gap-2 disabled:bg-indigo-400"
              >
                {isLoadingFromWeb ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Cargar desde Web
                  </>
                )}
              </button>

              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-all font-medium flex items-center gap-2">
                <Upload className="w-4 h-4" />
                JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={importJSON}
                  className="hidden"
                />
              </label>

              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>

              <button
                onClick={() => openDialog()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-bold flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Añadir a Espera
              </button>
            </div>
          </div>
        </div>

        {/* Waiting Trucks Banner */}
        {trucks.filter((t) => t.estado === "pending").length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-bold text-blue-900">
                    Camiones en espera:{" "}
                    {trucks.filter((t) => t.estado === "pending").length}
                  </div>
                  <div className="text-sm text-blue-700">
                    {trucks
                      .filter((t) => t.estado === "pending")
                      .map((t) => t.transportista)
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(" → ")}
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  setTrucks(trucks.filter((t) => t.estado !== "pending"))
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}

        {/* Muelles Grid */}
        {filteredTrucks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay muelles
            </h3>
            <p className="text-gray-500 mb-4">
              Importa un archivo Excel o carga datos desde la web
            </p>
            <div className="flex gap-3 justify-center">
              <label className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-all font-medium flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Importar Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={importExcel}
                  className="hidden"
                />
              </label>
              <button
                onClick={loadFromWeb}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Cargar desde Web
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {filteredTrucks.map((truck) => (
              <div
                key={truck.id}
                className={`bg-white rounded-lg shadow hover:shadow-lg transition-all border-t-4 ${getCardBorderColor(
                  truck
                )} overflow-hidden`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      Muelle {truck.muelle || truck.id}
                      {truck.estadoMuelle === "*" && (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                    </h3>
                  </div>

                  {truck.estado === "pending" ? (
                    <div className="text-center py-8">
                      <div className="text-green-600 font-bold text-lg mb-2">
                        Libre
                      </div>
                      <button
                        onClick={() => openDialog(truck)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Click para asignar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-700">
                            {truck.matricula || truck.transportista}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span className="text-gray-600 truncate">
                            {truck.destino}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500">
                          Lado: {sideType}
                        </div>

                        {truck.llegada && (
                          <div className="text-xs text-gray-600">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {truck.llegada}
                          </div>
                        )}

                        {(truck.salidaTope || truck.salida) && (
                          <div className="text-xs text-gray-600">
                            Tiempo: {truck.salidaTope || truck.salida}
                          </div>
                        )}
                      </div>

                      {truck.observaciones && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                          <div className="text-xs text-yellow-800 line-clamp-2">
                            {truck.observaciones}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {truck.estado !== "accepted" && (
                          <button
                            onClick={() => acceptTruck(truck.id)}
                            className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-all text-sm font-medium"
                          >
                            Aceptar
                          </button>
                        )}
                        <button
                          onClick={() => openDialog(truck)}
                          className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-all text-sm font-medium"
                        >
                          Editar
                        </button>
                      </div>

                      {truck.estadoMuelle === "*" && (
                        <button className="w-full mt-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-all text-xs font-medium">
                          Registrar incidencia
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingTruck ? "Editar Camión" : "Nuevo Camión"}
              </h2>
              <button
                onClick={closeDialog}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Transportista *
                  </label>
                  <input
                    type="text"
                    value={formData.transportista || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transportista: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Nombre"
                  />
                </div>

                {sideType !== "2" && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Matrícula
                      </label>
                      <input
                        type="text"
                        value={formData.matricula || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            matricula: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="1234ABC"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Muelle
                      </label>
                      <input
                        type="text"
                        value={formData.muelle || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, muelle: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="312"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        value={formData.estadoMuelle || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            estadoMuelle: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="">-</option>
                        <option value="OK">OK</option>
                        <option value="*">* Incidencia</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Destino *
                </label>
                <input
                  type="text"
                  value={formData.destino || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, destino: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Ciudad o ubicación"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Llegada
                  </label>
                  <TimeInput
                    value={formData.llegada || ""}
                    onChange={(value) =>
                      setFormData({ ...formData, llegada: value })
                    }
                    placeholder="16:24"
                  />
                </div>

                {sideType === "3" && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Salida
                    </label>
                    <TimeInput
                      value={formData.salida || ""}
                      onChange={(value) =>
                        setFormData({ ...formData, salida: value })
                      }
                      placeholder="18:24"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {sideType === "2" ? "Salida" : "Salida Tope"}
                  </label>
                  <TimeInput
                    value={
                      sideType === "2"
                        ? formData.salida || ""
                        : formData.salidaTope || ""
                    }
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        [sideType === "2" ? "salida" : "salidaTope"]: value,
                      })
                    }
                    placeholder="20:00"
                  />
                </div>

                {sideType !== "2" && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      Fuera
                    </label>
                    <TimeInput
                      value={formData.fuera || ""}
                      onChange={(value) =>
                        setFormData({ ...formData, fuera: value })
                      }
                      placeholder="22:00"
                    />
                  </div>
                )}
              </div>

              {sideType === "2" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Remolque
                  </label>
                  <input
                    type="text"
                    value={formData.remolque || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, remolque: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Matrícula remolque"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  rows="2"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="p-5 bg-gray-50 flex gap-3 justify-end border-t">
              <button
                onClick={closeDialog}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                {editingTruck ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TruckLoadingPlanner;
