import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  Check,
  Clock,
  Truck,
  MapPin,
  AlertCircle,
  Upload,
  Download,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Globe,
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
  const [urlDialog, setUrlDialog] = useState(false);
  const [url, setUrl] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar datos desde localStorage al iniciar
  useEffect(() => {
    const savedData = localStorage.getItem("truckLoadingData");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.trucks) setTrucks(parsed.trucks);
        if (parsed.sideType) setSideType(parsed.sideType);
        if (parsed.nextId) setNextId(parsed.nextId);
      } catch (error) {
        console.error("Error al cargar datos guardados:", error);
      }
    }
  }, []);

  // Guardar automáticamente en localStorage
  useEffect(() => {
    const dataToSave = {
      trucks,
      sideType,
      nextId,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem("truckLoadingData", JSON.stringify(dataToSave));
  }, [trucks, sideType, nextId]);

  // Reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const showSuccess = (message) => {
    setShowSuccessMessage(message);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

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
    if (typeof excelTime === "string") {
      if (excelTime.includes(":")) return excelTime;
      if (excelTime.length === 4) {
        return `${excelTime.slice(0, 2)}:${excelTime.slice(2)}`;
      }
      return excelTime;
    }

    const totalMinutes = Math.round(excelTime * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const handleCargarDesdeURL = async () => {
    if (!url) {
      alert("Por favor ingresa una URL válida");
      return;
    }

    try {
      showSuccess("Cargando datos desde URL...");

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Error al obtener datos de la URL");
      }

      const data = await response.json();

      if (data.trucks && Array.isArray(data.trucks)) {
        setTrucks(data.trucks);
        const maxId = Math.max(...data.trucks.map((t) => t.id), 0);
        setNextId(maxId + 1);
        showSuccess(`${data.trucks.length} camiones cargados desde URL`);
      } else {
        showSuccess("Datos cargados desde URL correctamente");
      }

      setUrlDialog(false);
    } catch (error) {
      console.error("Error al cargar desde URL:", error);
      alert(
        "Error al obtener datos de la URL. Verifica la conexión y el formato."
      );
    }
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
    const urlBlob = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlBlob;
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
    const urlBlob = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlBlob;
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
            raw: false,
          });

          let headerRowIndex = -1;
          for (let i = 0; i < Math.min(5, data.length); i++) {
            const row = data[i];
            if (
              row.some((cell) =>
                String(cell).toUpperCase().includes("TRANSPORTISTA")
              )
            ) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) {
            alert(
              "No se encontró la fila de encabezados. Verifica el formato del archivo."
            );
            return;
          }

          const headers = data[headerRowIndex].map((h) =>
            String(h).trim().toUpperCase()
          );

          let detectedSideType = "3";
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

          const importedTrucks = [];
          let currentId = nextId;

          for (let i = headerRowIndex + 1; i < data.length; i++) {
            const row = data[i];
            if (!row[0] || row.length === 0) continue;

            const getColumnValue = (columnName) => {
              const index = headers.indexOf(columnName);
              return index !== -1 ? String(row[index] || "").trim() : "";
            };

            let truck = {
              id: currentId++,
              estado: "pending",
              transportista: getColumnValue("TRANSPORTISTA"),
              destino: getColumnValue("DESTINO"),
              observaciones: getColumnValue("OBSERVACIONES"),
            };

            if (detectedSideType === "2") {
              truck = {
                ...truck,
                llegada: parseExcelTime(getColumnValue("LLEGADA")),
                salida: parseExcelTime(getColumnValue("SALIDA")),
                remolque: getColumnValue("REMOLQUE"),
              };
            } else if (detectedSideType === "3") {
              const estadoValue = getColumnValue("ESTADO");
              truck = {
                ...truck,
                matricula: getColumnValue("MATRICULA"),
                muelle: getColumnValue("MUELLE"),
                estadoMuelle: estadoValue,
                llegada: parseExcelTime(getColumnValue("LLEGADA")),
                salida: parseExcelTime(getColumnValue("SALIDA")),
                salidaTope: parseExcelTime(getColumnValue("SALIDA TOPE")),
                fuera: getColumnValue("FUERA"),
              };

              if (estadoValue === "OK" || estadoValue === "*") {
                truck.estado = "accepted";
              }
            } else {
              const estadoValue = getColumnValue("ESTADO");
              truck = {
                ...truck,
                matricula: getColumnValue("MATRICULA"),
                muelle: getColumnValue("MUELLE"),
                estadoMuelle: estadoValue,
                llegada: parseExcelTime(getColumnValue("LLEGADA")),
                salidaTope: parseExcelTime(getColumnValue("SALIDA TOPE")),
                fuera: getColumnValue("FUERA"),
              };

              if (estadoValue === "OK" || estadoValue === "*") {
                truck.estado = "accepted";
              }
            }

            if (truck.transportista) {
              importedTrucks.push(truck);
            }
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

  const clearAllData = () => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer."
      )
    ) {
      setTrucks([]);
      setNextId(1);
      localStorage.removeItem("truckLoadingData");
      showSuccess("Todos los datos han sido eliminados");
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

  const filteredTrucks = trucks.filter((truck) => {
    const matchesFilter =
      filterEstado === "all"
        ? true
        : filterEstado === "accepted"
        ? truck.estado === "accepted"
        : filterEstado === "pending"
        ? truck.estado === "pending"
        : truck.estadoMuelle === "*";

    const matchesSearch =
      searchTerm === "" ||
      truck.transportista?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.destino?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.muelle?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Sistema de Gestión de Muelles
            </h1>
            <p className="text-blue-100 text-sm">
              Control en tiempo real del almacén logístico - Lado {sideType}
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
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg shadow animate-pulse">
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
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-3 flex-1">
              <input
                type="text"
                placeholder="Buscar por transportista, destino, matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />

              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">Todos</option>
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
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
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
                CSV
              </button>

              <button
                onClick={exportToJSON}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-medium flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>

              <button
                onClick={() => setUrlDialog(true)}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all font-medium flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Cargar URL
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearAllData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Borrar Todo
              </button>

              <button
                onClick={() => openDialog()}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-bold flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Añadir Camión
              </button>
            </div>
          </div>
        </div>

        {/* Muelles Grid */}
        {filteredTrucks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {trucks.length === 0
                ? "No hay muelles registrados"
                : "No se encontraron resultados"}
            </h3>
            <p className="text-gray-500 mb-4">
              {trucks.length === 0
                ? "Importa un archivo Excel o añade un camión manualmente"
                : "Intenta cambiar los filtros o el término de búsqueda"}
            </p>
            {trucks.length === 0 && (
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
                  onClick={() => openDialog()}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Añadir Camión
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      {truck.muelle ? `Muelle ${truck.muelle}` : `#${truck.id}`}
                      {truck.estadoMuelle === "*" && (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openDialog(truck)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTruck(truck.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-700 truncate">
                        {truck.transportista || "Sin transportista"}
                      </span>
                    </div>

                    {truck.matricula && (
                      <div className="text-xs text-gray-600 font-mono">
                        {truck.matricula}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-gray-600 truncate">
                        {truck.destino || "Sin destino"}
                      </span>
                    </div>

                    {truck.llegada && (
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Llegada: {truck.llegada}
                      </div>
                    )}

                    {(truck.salidaTope || truck.salida) && (
                      <div className="text-xs text-gray-600">
                        {truck.salida && `Salida: ${truck.salida}`}
                        {truck.salidaTope && ` | Tope: ${truck.salidaTope}`}
                      </div>
                    )}

                    {truck.fuera && (
                      <div className="text-xs text-gray-600">
                        Fuera: {truck.fuera}
                      </div>
                    )}

                    {truck.estadoMuelle && (
                      <div
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          truck.estadoMuelle === "OK"
                            ? "bg-green-100 text-green-800"
                            : truck.estadoMuelle === "*"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {truck.estadoMuelle}
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
                    {truck.estado === "pending" ? (
                      <button
                        onClick={() => acceptTruck(truck.id)}
                        className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-all text-sm font-medium"
                      >
                        Aceptar
                      </button>
                    ) : (
                      <div className="flex-1 px-3 py-1.5 bg-green-50 text-green-700 rounded text-sm font-medium text-center">
                        ✓ Aceptado
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dialog - Añadir/Editar Camión */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 flex items-center justify-between sticky top-0">
              <h2 className="text-xl font-bold text-white">
                {editingTruck ? "Editar Camión" : "Nuevo Camión"}
              </h2>
              <button
                onClick={closeDialog}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
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
                    placeholder="Nombre del transportista"
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
                            matricula: e.target.value.toUpperCase(),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
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
                        Estado del Muelle
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
                        <option value="">Seleccionar...</option>
                        <option value="OK">OK</option>
                        <option value="*">* Incidencia</option>
                      </select>
                    </div>
                  </>
                )}

                <div className={sideType === "2" ? "col-span-2" : ""}>
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
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Horarios
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
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
                      <label className="block text-xs text-gray-600 mb-1">
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
                    <label className="block text-xs text-gray-600 mb-1">
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
                      <label className="block text-xs text-gray-600 mb-1">
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
                      setFormData({
                        ...formData,
                        remolque: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
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
                  rows="3"
                  placeholder="Notas adicionales, incidencias, instrucciones especiales..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs text-blue-800">
                  <strong>Nota:</strong> Los campos marcados con * son
                  obligatorios. Los datos se guardan automáticamente en tu
                  navegador.
                </div>
              </div>
            </div>

            <div className="p-5 bg-gray-50 flex gap-3 justify-end border-t sticky bottom-0">
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

      {/* Modal Dialog - Cargar desde URL */}
      {urlDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-5 flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Cargar datos desde URL
                </h2>
                <p className="text-cyan-100 text-sm mt-1">
                  Conecta con una fuente externa de datos
                </p>
              </div>
              <button
                onClick={() => setUrlDialog(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  URL de origen
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://ejemplo.com/api/datos.json"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Introduce la URL donde se encuentran los datos de los muelles
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-yellow-800">
                    <strong>Nota:</strong> La URL debe devolver datos en formato
                    JSON compatible. Estructura esperada:{" "}
                    <code className="bg-yellow-100 px-1 rounded">
                      &#123;"trucks": [...]&#125;
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-gray-50 flex gap-3 justify-end border-t rounded-b-xl">
              <button
                onClick={() => setUrlDialog(false)}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCargarDesdeURL}
                disabled={!url}
                className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-all font-bold flex items-center gap-2 disabled:bg-cyan-400 disabled:cursor-not-allowed"
              >
                <Globe className="w-5 h-5" />
                Cargar Datos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TruckLoadingPlanner;
