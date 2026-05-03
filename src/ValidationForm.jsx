import React, { useState } from 'react';
import { Network, CheckCircle, XCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import './ValidationForm.css';
import ipv4Img from './assets/ipv4-automata.png';
import macImg from './assets/mac-automata.png';

export default function ValidationForm() {
  const [type, setType] = useState('ipv4'); // 'ipv4' or 'mac'
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);
  const [path, setPath] = useState([]);
  const [loading, setLoading] = useState(false);

  // Diccionario con las definiciones formales de los autómatas
  const automataDefinitions = {
    ipv4: {
      title: "Definición Formal: IPv4",
      states: "Q = {q0, q_digit_g1, q_dot_1, q_digit_g2, q_dot_2, q_digit_g3, q_dot_3, q_digit_g4, q_accept, q_error}",
      alphabet: "Σ = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, .}",
      language: "L = { w ∈ Σ* | w es una dirección IPv4 válida (0.0.0.0 a 255.255.255.255) }",
      initialState: "q0 = q0",
      acceptingStates: "F = {q_accept}",
      validExamples: ["192.168.1.1", "10.0.0.255", "127.0.0.1"],
      invalidExamples: ["256.1.2.3", "192.168.1", "192.168.01.1", "abc.def.ghi.jkl"]
    },
    mac: {
      title: "Definición Formal: MAC",
      states: "Q = {q0, q1, q2, ..., q17, q_error}",
      alphabet: "Σ = {0-9, A-F, a-f, :, -}",
      language: "L = { w ∈ Σ* | w es una dirección MAC válida (6 grupos de 2 dígitos hexadecimales) }",
      initialState: "q0 = q0",
      acceptingStates: "F = {q17}",
      validExamples: ["00:1A:2B:3C:4D:5E", "A1-B2-C3-D4-E5-F6", "00:00:00:00:00:00"],
      invalidExamples: ["00:1A:2B:3C:4D", "00:1A:2B:3C:4D:5E:6F", "00:1X:2B:3C:4D:5E", "00:1A-2B:3C-4D:5E"]
    }
  };

  const currentDef = automataDefinitions[type];

  // Función que se ejecuta cuando se envía el formulario
  const handleValidate = async (e) => {
    e.preventDefault();
    if (!inputValue) {
      setResult(null);
      setPath([]);
      return;
    }

    setLoading(true);
    try {
      // Realiza una solicitud POST al servidor backend
      // Recibe un body { type: "ipv4" | "mac", value: string }
      const response = await fetch('http://localhost:8000/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, value: inputValue })
      });
      // Espera una respuesta como { valid: boolean, path: string[] }
      const data = await response.json();
      // Actualiza el estado con el resultado
      setResult(data.valid);
      // Actualiza el estado con la ruta del autómata
      setPath(data.path);
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
      setResult(false);
      setPath(['error_conexion']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="validation-container">
      <div className="content-wrapper">
        <div className="main-panel">
          <div className="card-header">
            <div className="icon-wrapper">
              <ShieldCheck className="shield-icon" size={32} />
            </div>
            <h2>Validador de Direcciones</h2>
            <p>Verifica direcciones IPv4 o MAC usando Autómatas Finitos</p>
          </div>

        <form onSubmit={handleValidate} className="validation-form">
          <div className="type-selector">
            <button
              type="button"
              className={`type-btn ${type === 'ipv4' ? 'active' : ''}`}
              onClick={() => { setType('ipv4'); setResult(null); setPath([]); setInputValue(''); }}
            >
              IPv4
            </button>
            <button
              type="button"
              className={`type-btn ${type === 'mac' ? 'active' : ''}`}
              onClick={() => { setType('mac'); setResult(null); setPath([]); setInputValue(''); }}
            >
              MAC Address
            </button>
          </div>

          <div className="input-group">
            <label htmlFor="address-input">
              {type === 'ipv4' ? 'Dirección IPv4' : 'Dirección MAC'}
            </label>
            <div className="input-wrapper">
              <Network className="input-icon" size={20} />
              <input
                id="address-input"
                type="text"
                placeholder={type === 'ipv4' ? 'Ej. 192.168.1.1' : 'Ej. 00:1A:2B:3C:4D:5E'}
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); setResult(null); setPath([]); }}
              />
            </div>
          </div>

          <button type="submit" className="validate-btn" disabled={loading}>
            {loading ? 'Validando...' : 'Validar cadena'}
          </button>

        </form>

        {result !== null && (
          <div className={`result-container`}>
            <div className={`result-box ${result ? 'success' : 'error'}`}>
              {result ? (
                <>
                  <CheckCircle size={24} />
                  <span>La dirección es <strong>VÁLIDA</strong>.</span>
                </>
              ) : (
                <>
                  <XCircle size={24} />
                  <span>La dirección es <strong>INVÁLIDA</strong>.</span>
                </>
              )}
            </div>
            
            <div className="path-box">
              <h3>Ruta del Autómata:</h3>
              <div className="path-flow">
                {path.map((state, index) => (
                  <React.Fragment key={index}>
                    <span className={`state-badge ${state === 'q_error' ? 'error-state' : state === 'q_accept' ? 'accept-state' : ''}`}>
                      {state}
                    </span>
                    {index < path.length - 1 && <ArrowRight size={16} className="path-arrow" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>

        <div className="side-panel">
          <div className="formal-definition-box">
            <h3>{currentDef.title}</h3>
            <ul>
              <li><strong>Estados (Q):</strong> <code>{currentDef.states}</code></li>
              <li><strong>Alfabeto (Σ):</strong> <code>{currentDef.alphabet}</code></li>
              <li><strong>Lenguaje (L):</strong> <code>{currentDef.language}</code></li>
              <li><strong>Estado Inicial (q0):</strong> <code>{currentDef.initialState}</code></li>
              <li><strong>Estados de Aceptación (F):</strong> <code>{currentDef.acceptingStates}</code></li>
            </ul>
            <div className="examples-container">
              <div className="example-col valid">
                <h4>Ejemplos Válidos</h4>
                <ul>
                  {currentDef.validExamples.map((ex, i) => <li key={i}><CheckCircle size={14}/> {ex}</li>)}
                </ul>
              </div>
              <div className="example-col invalid">
                <h4>Ejemplos Inválidos</h4>
                <ul>
                  {currentDef.invalidExamples.map((ex, i) => <li key={i}><XCircle size={14}/> {ex}</li>)}
                </ul>
              </div>
            </div>

            <div className="automata-image-container">
            <img 
              src={type === 'ipv4' ? ipv4Img : macImg} 
              alt={`Autómata ${type.toUpperCase()}`} 
              className="automata-img"
            />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
