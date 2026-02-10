import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { diffChars } from 'diff';
import { getCorpusByScript } from '../utils/api';
import type { CorpusData } from '../utils/api';

interface ScriptDiffViewerProps {
    baselineScript: string;
    experimentScript: string;
}

interface CorpusPair {
    canvasName: string;
    corpusName: string;
    baselineContent: string;
    experimentContent: string;
}

const ScriptDiffViewer: React.FC<ScriptDiffViewerProps> = ({ baselineScript, experimentScript }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pairs, setPairs] = useState<CorpusPair[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!baselineScript || !experimentScript) return;

            setLoading(true);
            setError(null);
            try {
                const [baselineData, experimentData] = await Promise.all([
                    getCorpusByScript(baselineScript),
                    getCorpusByScript(experimentScript)
                ]);

                // Group by canvas_name + corpus_name
                const baselineMap = new Map<string, string>();
                baselineData.forEach((item: CorpusData) => {
                    const key = `${item.canvas_name}|${item.corpus_name}`;
                    baselineMap.set(key, item.corpus_content);
                });

                const experimentMap = new Map<string, string>();
                experimentData.forEach((item: CorpusData) => {
                    const key = `${item.canvas_name}|${item.corpus_name}`;
                    experimentMap.set(key, item.corpus_content);
                });

                // Get all unique keys
                const allKeys = new Set([...baselineMap.keys(), ...experimentMap.keys()]);

                const newPairs: CorpusPair[] = [];
                allKeys.forEach(key => {
                    const parts = key.split('|');
                    const canvasName = parts[0] || '';
                    const corpusName = parts[1] || '';
                    const baselineContent = (baselineMap.get(key) ?? '') as string;
                    const experimentContent = (experimentMap.get(key) ?? '') as string;

                    if (baselineContent !== experimentContent) {
                         newPairs.push({
                            canvasName,
                            corpusName,
                            baselineContent,
                            experimentContent
                        });
                    }
                });

                // Sort by canvasName then corpusName
                newPairs.sort((a, b) => {
                    if (a.canvasName !== b.canvasName) return a.canvasName.localeCompare(b.canvasName);
                    return a.corpusName.localeCompare(b.corpusName);
                });

                setPairs(newPairs);
            } catch (err) {
                console.error("Failed to fetch corpus data", err);
                setError("获取话术数据失败");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [baselineScript, experimentScript]);

    if (!baselineScript || !experimentScript) return null;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
         return (
            <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        );
    }

    if (pairs.length === 0) {
        return (
             <Alert severity="info" sx={{ m: 2 }}>所选话术无差异</Alert>
        );
    }

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5' }}>
             <Typography variant="h6" gutterBottom>
                语料差异
            </Typography>
            <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                 {/* Header */}
                 <Box sx={{ display: 'flex', borderBottom: '1px solid #e0e0e0', bgcolor: '#009688', color: 'white' }}>
                    <Box sx={{ width: 200, p: 2, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                        <Typography fontWeight="bold">语料差异</Typography>
                    </Box>
                    <Box sx={{ flex: 1, p: 2, borderRight: '1px solid rgba(255,255,255,0.2)' }}>
                        <Typography fontWeight="bold">{baselineScript}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, p: 2 }}>
                        <Typography fontWeight="bold">{experimentScript}</Typography>
                    </Box>
                 </Box>

                 {/* Rows */}
                 {pairs.map((pair, index) => (
                    <Box key={index} sx={{ display: 'flex', borderBottom: '1px solid #e0e0e0', bgcolor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <Box sx={{ width: 200, p: 2, flexShrink: 0, borderRight: '1px solid #e0e0e0' }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                                {pair.canvasName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {pair.corpusName}
                            </Typography>
                        </Box>
                         <Box sx={{ flex: 1, p: 2, borderRight: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" color="text.secondary" fontWeight="bold" sx={{ mb: 1 }}>旧语料:</Typography>
                            <DiffContent text1={pair.baselineContent} text2={pair.experimentContent} type="old" />
                        </Box>
                        <Box sx={{ flex: 1, p: 2 }}>
                             <Typography variant="body2" color="text.secondary" fontWeight="bold" sx={{ mb: 1 }}>新语料:</Typography>
                             <DiffContent text1={pair.baselineContent} text2={pair.experimentContent} type="new" />
                        </Box>
                    </Box>
                 ))}
            </Paper>
        </Box>
    );
};

const DiffContent: React.FC<{ text1: string, text2: string, type: 'old' | 'new' }> = ({ text1, text2, type }) => {
    const diff = diffChars(text1, text2);

    return (
        <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
            {diff.map((part, index) => {
                if (type === 'old') {
                     if (part.removed) {
                        return <span key={index} style={{ color: 'red', textDecoration: 'line-through', fontWeight: 'bold' }}>{part.value}</span>;
                     }
                     if (part.added) {
                        return null; // Don't show added parts in old version
                     }
                     return <span key={index}>{part.value}</span>;
                } else {
                     if (part.added) {
                        return <span key={index} style={{ color: 'green', fontWeight: 'bold' }}>{part.value}</span>;
                     }
                     if (part.removed) {
                        return null; // Don't show removed parts in new version
                     }
                     return <span key={index}>{part.value}</span>;
                }
            })}
        </Typography>
    );
}

export default ScriptDiffViewer;
