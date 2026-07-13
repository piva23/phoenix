import { useState, useEffect, useMemo } from 'react';
import { useRelationshipStore } from '../../../stores/useRelationshipStore';
import { getLevelColor, CATEGORIES } from '../algorithms/relationshipAlgorithms';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Haversine formula to calculate distance in km between two coordinates
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export function SocialRadarView({ onSelectPerson }) {
  const { people, userCoords, userRadius, setUserCoords, setUserRadius, updatePerson } = useRelationshipStore();
  const [loading, setLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Default coordinate if browser/mock is empty
  useEffect(() => {
    if (!userCoords || (userCoords.lat === null && userCoords.lng === null)) {
      setUserCoords({ lat: -23.5505, lng: -46.6333 }); // Default: São Paulo
    }
  }, [userCoords, setUserCoords]);

  // Capture user coordinates
  const handleUpdateRadar = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não é suportada por este navegador.');
      return;
    }

    setLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setLoading(false);
        toast.success('Sinal de satélite fixado! Coordenadas atualizadas. 📡', {
          style: { background: '#1e293b', color: '#fff' },
        });
      },
      (error) => {
        setLoading(false);
        let errorMsg = 'Não foi possível obter a localização.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Permissão de localização negada pelo utilizador.';
          setGpsError('permission_denied');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Sinal de GPS indisponível no momento.';
          setGpsError('unavailable');
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Tempo limite excedido ao obter localização.';
          setGpsError('timeout');
        }
        toast.error(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Filter people with coordinates and calculate distance
  const peopleWithDistances = useMemo(() => {
    if (!userCoords || userCoords.lat === null || userCoords.lng === null) return [];
    
    return people.map(p => {
      const dist = calculateDistance(userCoords.lat, userCoords.lng, p.lat, p.lng);
      return {
        ...p,
        distance: dist,
      };
    }).sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }, [people, userCoords]);

  // People strictly inside the specified user radius
  const insideRadiusPeople = useMemo(() => {
    return peopleWithDistances.filter(p => p.distance !== null && p.distance <= userRadius);
  }, [peopleWithDistances, userRadius]);

  // People with no coordinates assigned
  const outsideOrNoCoordsPeople = useMemo(() => {
    return peopleWithDistances.filter(p => p.distance === null);
  }, [peopleWithDistances]);

  // Helper to quickly assign simulated coords near the user for demonstration purposes
  const handleSimulateCoords = (personId) => {
    if (!userCoords || userCoords.lat === null) {
      toast.error('Primeiro capture ou defina as suas coordenadas.');
      return;
    }
    // Random offset in a ~ 2-8 km range
    const radiusInDeg = (userRadius * 0.6) / 111.32; // 1 degree is roughly 111.32km
    const angle = Math.random() * Math.PI * 2;
    const offsetLat = Math.sin(angle) * radiusInDeg;
    const offsetLng = Math.cos(angle) * (radiusInDeg / Math.cos(userCoords.lat * Math.PI / 180));

    const simulatedLat = userCoords.lat + offsetLat;
    const simulatedLng = userCoords.lng + offsetLng;

    updatePerson(personId, {
      lat: simulatedLat,
      lng: simulatedLng,
      lastKnownLocation: `Simulado (Próximo a si)`
    });

    toast.success(`Coordenadas simuladas atribuídas com sucesso!`);
  };

  // Plot blips on SVG radar chart
  const radarBlips = useMemo(() => {
    if (!userCoords || userCoords.lat === null || userCoords.lng === null || insideRadiusPeople.length === 0) return [];
    
    const centerX = 150;
    const centerY = 150;
    const maxRadiusPx = 130; // Max radius on SVG

    return insideRadiusPeople.map(p => {
      const d = p.distance;
      const ratio = d / userRadius; // scale distance relative to selected radius limit
      
      // Calculate heading direction angle based on delta coordinates
      const dy = p.lat - userCoords.lat;
      const dx = (p.lng - userCoords.lng) * Math.cos(userCoords.lat * Math.PI / 180);
      
      let angle = Math.atan2(dy, dx); // in radians

      // Plot coords on SVG
      const x = centerX + Math.cos(angle) * ratio * maxRadiusPx;
      const y = centerY - Math.sin(angle) * ratio * maxRadiusPx;

      return {
        id: p.id,
        name: p.name,
        nickname: p.nickname,
        distance: p.distance,
        color: getLevelColor(p.relationshipScore),
        x,
        y,
      };
    });
  }, [insideRadiusPeople, userCoords, userRadius]);

  return (
    <div className="space-y-6">
      
      {/* ── GPS SATELITE SCANNER ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-[#121824] to-black rounded-3xl border border-gray-800 p-6 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Animated Sweep Line & Background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
        
        <h3 className="text-xs font-black text-purple-400 tracking-widest uppercase mb-4 z-10 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
          Mapeamento Social Ativo
        </h3>

        {/* The SVG Radar Scanner */}
        <div className="relative w-[300px] h-[300px] mb-4 z-10 flex items-center justify-center">
          {/* Rotating radar sweep */}
          <div className="absolute w-[260px] h-[260px] rounded-full border border-purple-500/10 pointer-events-none overflow-hidden">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              className="absolute inset-0 origin-center bg-gradient-conic from-purple-500/20 via-transparent to-transparent"
              style={{
                borderRadius: '50%',
              }}
            />
          </div>

          <svg width="300" height="300" className="absolute top-0 left-0 drop-shadow-lg">
            {/* Concentric rings */}
            <circle cx="150" cy="150" r="130" fill="none" stroke="rgba(168,85,247,0.1)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="150" cy="150" r="90" fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth="1" />
            <circle cx="150" cy="150" r="50" fill="none" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" />
            
            {/* Axis Lines */}
            <line x1="150" y1="20" x2="150" y2="280" stroke="rgba(168,85,247,0.08)" strokeWidth="1" />
            <line x1="20" y1="150" x2="280" y2="150" stroke="rgba(168,85,247,0.08)" strokeWidth="1" />
            
            {/* Center (You) */}
            <circle cx="150" cy="150" r="6" fill="#A855F7" stroke="#fff" strokeWidth="1.5" className="animate-pulse" />
            <circle cx="150" cy="150" r="16" fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth="1" className="animate-ping" style={{ animationDuration: '3s' }} />

            {/* Blips plotted */}
            {radarBlips.map(blip => (
              <g key={blip.id} className="cursor-pointer group">
                {/* Blip ring */}
                <circle cx={blip.x} cy={blip.y} r="10" fill="none" stroke={blip.color} strokeWidth="1" opacity="0.3" className="animate-ping" style={{ animationDuration: '2s' }} />
                {/* Blip point */}
                <circle cx={blip.x} cy={blip.y} r="5" fill={blip.color} stroke="#fff" strokeWidth="1" />
                {/* Label text */}
                <text
                  x={blip.x}
                  y={blip.y - 10}
                  fill="#94a3b8"
                  fontSize="8"
                  fontWeight="black"
                  textAnchor="middle"
                  className="bg-black/80 px-1 py-0.5 rounded transition-all pointer-events-none"
                >
                  {blip.nickname || blip.name.split(' ')[0]} ({blip.distance.toFixed(1)}km)
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Controls */}
        <div className="w-full space-y-4 z-10">
          <div className="flex items-center justify-between text-xs font-black text-gray-400 uppercase tracking-wider bg-black/40 p-3 rounded-2xl border border-gray-800">
            <div>
              <p className="text-gray-500 text-[10px] uppercase">A sua Posição</p>
              <p className="font-mono text-white mt-0.5">
                {userCoords?.lat ? `${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}` : 'Aguardando GPS...'}
              </p>
            </div>
            <button
              onClick={handleUpdateRadar}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black rounded-xl transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-purple-600/30"
            >
              {loading ? 'Sincronizando...' : '🔄 Sincronizar GPS'}
            </button>
          </div>

          {/* Slider for radius */}
          <div className="bg-black/30 border border-gray-800/80 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider">
              <span className="text-gray-400">Raio de Escaneamento</span>
              <span className="text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg">{userRadius} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={userRadius}
              onChange={(e) => setUserRadius(Number(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer h-1 bg-gray-800 rounded-lg appearance-none"
            />
            <p className="text-[9px] text-gray-500 font-bold leading-normal uppercase">
              Filtra contactos dentro desta distância física calculada através da fórmula de Haversine.
            </p>
          </div>
        </div>
      </div>

      {/* ── NOTA DE PERMISSÃO / ERRO GPS ───────────────────────────────────── */}
      {gpsError && (
        <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/20 rounded-2xl text-xs space-y-2">
          <p className="font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1">
            ⚠️ Permissão de Geolocalização Requerida
          </p>
          <p className="text-gray-400 font-bold leading-relaxed">
            Seu navegador ou iframe bloqueou o acesso ao GPS nativo. O radar utilizou as coordenadas padrões. Pode definir coordenadas manualmente para os seus contactos abaixo para testar o escaneamento perfeitamente!
          </p>
        </div>
      )}

      {/* ── CONTATOS DENTRO DO RAIO ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h4 className="text-xs font-black text-white uppercase tracking-widest">
            Alvos no Raio ({insideRadiusPeople.length})
          </h4>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
            Distância Real Calculada
          </span>
        </div>

        {insideRadiusPeople.length === 0 ? (
          <div className="p-10 text-center bg-black/20 rounded-3xl border border-dashed border-gray-800">
            <span className="text-4xl mb-3 block">🛰️</span>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Nenhum Contacto Próximo</p>
            <p className="text-[10px] text-gray-500 mt-2 max-w-xs mx-auto font-bold leading-relaxed uppercase">
              Aumente o raio de atuação ou adicione coordenadas aos contactos na lista abaixo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {insideRadiusPeople.map(p => {
              const color = getLevelColor(p.relationshipScore);
              const cat = CATEGORIES.find(c => c.id === p.categoryId);
              
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectPerson(p)}
                  className="p-4 rounded-2xl border bg-gray-900/40 hover:bg-gray-800/40 cursor-pointer transition-all border-gray-800 flex items-center gap-3 relative overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-xs relative" style={{ background: color }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white truncate">{p.nickname || p.name}</span>
                      {cat && <span className="text-[9px]">{cat.emoji}</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                      {p.lastKnownLocation || 'Local Desconhecido'}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-purple-400">
                      {p.distance.toFixed(1)} km
                    </div>
                    <div className="text-[8px] text-gray-500 uppercase tracking-wider mt-0.5 font-bold">
                      afastamento
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ATRIBUIÇÃO DE COORDENADAS (DEMONSTRAÇÃO / FALLBACK) ───────────────── */}
      {outsideOrNoCoordsPeople.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="px-1">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Contactos sem Localização ({outsideOrNoCoordsPeople.length})
            </h4>
            <p className="text-[9px] text-gray-500 font-bold mt-0.5 uppercase">Atribua coordenadas simuladas para testar o Radar Social</p>
          </div>

          <div className="space-y-2 bg-gray-900/20 p-3 rounded-2xl border border-gray-800/60 max-h-[220px] overflow-y-auto pr-1">
            {outsideOrNoCoordsPeople.map(p => (
              <div key={p.id} className="flex justify-between items-center text-xs p-2 bg-black/20 border border-gray-800 rounded-xl">
                <span className="font-bold text-gray-300 truncate max-w-[140px]">{p.name}</span>
                <button
                  onClick={() => handleSimulateCoords(p.id)}
                  className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 rounded-lg text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  📍 Simular Posição Próxima
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default SocialRadarView;
