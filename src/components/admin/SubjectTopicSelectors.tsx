import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Subject {
    id: string;
    name: string;
}

interface Topic {
    id: string;
    name: string;
}

interface SubjectTopicSelectorsProps {
    examId?: string; // Optional - only required for notes category
    onSubjectChange: (id: string | null, name: string | null) => void;
    onTopicChange: (id: string | null, name: string | null) => void;
    className?: string;
    initialSubjectId?: string;
    initialTopicId?: string;
    initialSubjectName?: string | null;
    initialTopicName?: string | null;
    category?: 'notes' | 'questions';
}

export const SubjectTopicSelectors = ({
    examId,
    onSubjectChange,
    onTopicChange,
    className,
    initialSubjectId,
    initialTopicId,
    initialSubjectName,
    initialTopicName,
    category = 'notes'
}: SubjectTopicSelectorsProps) => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || "");
    const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || "");
    const [newSubjectName, setNewSubjectName] = useState(initialSubjectName || "");
    const [newTopicName, setNewTopicName] = useState(initialTopicName || "");
    const [isNewSubjectMode, setIsNewSubjectMode] = useState(!!initialSubjectName && !initialSubjectId);
    const [isNewTopicMode, setIsNewTopicMode] = useState(!!initialTopicName && !initialTopicId);

    useEffect(() => {
        // For questions category, load subjects regardless of exam since they're exam-independent
        // For notes category, require examId
        if (category === 'questions' || examId) {
            loadSubjects();
        }
    }, [examId, category]);

    useEffect(() => {
        if (selectedSubjectId && selectedSubjectId !== "new") {
            loadTopics(selectedSubjectId);
        } else {
            setTopics([]);
            setSelectedTopicId("");
            onTopicChange(null, null);
        }
    }, [selectedSubjectId]);

    const loadSubjects = async () => {
        // Build query - for questions category, don't filter by exam_id since subjects are exam-independent
        let query = supabase
            .from("subjects")
            .select("id, name")
            .eq("category", category)
            .order("order_index", { ascending: true });

        // Only filter by exam_id for notes category or if exam_id is provided and not for questions
        if (category === 'notes' && examId) {
            query = query.eq("exam_id", examId);
        }

        const { data, error } = await query;

        if (data) {
            setSubjects(data);
            if (!initialSubjectId && initialSubjectName) {
                const match = data.find(s => s.name.toLowerCase() === initialSubjectName.toLowerCase());
                if (match) {
                    setSelectedSubjectId(match.id);
                } else {
                    setIsNewSubjectMode(true);
                    setNewSubjectName(initialSubjectName);
                }
            }
        }
    };

    const loadTopics = async (subjectId: string) => {
        const { data, error } = await supabase
            .from("topics")
            .select("id, name")
            .eq("subject_id", subjectId)
            .eq("category", category)
            .order("order_index", { ascending: true });

        if (data) {
            setTopics(data);
            if (!initialTopicId && initialTopicName) {
                const match = data.find(t => t.name.toLowerCase() === initialTopicName.toLowerCase());
                if (match) {
                    setSelectedTopicId(match.id);
                } else {
                    setIsNewTopicMode(true);
                    setNewTopicName(initialTopicName);
                }
            }
        }
    };

    const handleSubjectChange = (value: string) => {
        if (value === "new") {
            setIsNewSubjectMode(true);
            setSelectedSubjectId("");
            onSubjectChange(null, "");
        } else {
            setSelectedSubjectId(value);
            setIsNewSubjectMode(false);
            const subject = subjects.find(s => s.id === value);
            onSubjectChange(value, subject?.name || null);
        }
    };

    const handleTopicChange = (value: string) => {
        if (value === "new") {
            setIsNewTopicMode(true);
            setSelectedTopicId("");
            onTopicChange(null, "");
        } else {
            setSelectedTopicId(value);
            setIsNewTopicMode(false);
            const topic = topics.find(t => t.id === value);
            onTopicChange(value, topic?.name || null);
        }
    };

    const handleNewSubjectNameChange = (name: string) => {
        setNewSubjectName(name);
        onSubjectChange(null, name);
    };

    const handleNewTopicNameChange = (name: string) => {
        setNewTopicName(name);
        onTopicChange(null, name);
    };

    const cancelNewSubject = () => {
        setIsNewSubjectMode(false);
        setNewSubjectName("");
        onSubjectChange(null, null);
    };

    const cancelNewTopic = () => {
        setIsNewTopicMode(false);
        setNewTopicName("");
        onTopicChange(null, null);
    };

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
            {/* Subject Selector */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Subject *</Label>
                {isNewSubjectMode ? (
                    <div className="flex gap-2">
                        <Input
                            value={newSubjectName}
                            onChange={(e) => handleNewSubjectNameChange(e.target.value)}
                            placeholder="Enter new subject name"
                            className="h-12 rounded-xl"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={cancelNewSubject}
                            className="h-12 w-12 rounded-xl shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <Select value={selectedSubjectId} onValueChange={handleSubjectChange}>
                        <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                    {subject.name}
                                </SelectItem>
                            ))}
                            <SelectItem value="new" className="text-emerald-600 font-medium">
                                <Plus className="w-4 h-4 mr-2 inline" /> Add New Subject
                            </SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Topic Selector */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Topic (Optional)</Label>
                {isNewTopicMode ? (
                    <div className="flex gap-2">
                        <Input
                            value={newTopicName}
                            onChange={(e) => handleNewTopicNameChange(e.target.value)}
                            placeholder="Enter new topic name"
                            className="h-12 rounded-xl"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={cancelNewTopic}
                            className="h-12 w-12 rounded-xl shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <Select
                        value={selectedTopicId}
                        onValueChange={handleTopicChange}
                        disabled={!selectedSubjectId && !isNewSubjectMode}
                    >
                        <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                        <SelectContent>
                            {topics.map((topic) => (
                                <SelectItem key={topic.id} value={topic.id}>
                                    {topic.name}
                                </SelectItem>
                            ))}
                            <SelectItem value="new" className="text-emerald-600 font-medium">
                                <Plus className="w-4 h-4 mr-2 inline" /> Add New Topic
                            </SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </div>
        </div>
    );
};
