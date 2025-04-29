import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";

export default function SystemSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("general");
  
  // These would be loaded from API in a real application
  const [generalSettings, setGeneralSettings] = useState({
    competitionName: "NSBM MathMaster Inter-School Competition",
    timePerQuestion: 60,
    maxQuestions: 50,
    allowRetake: false,
    showAnswers: true,
    showLeaderboard: true
  });
  
  const [emailSettings, setEmailSettings] = useState({
    senderEmail: "mathsmaster@nsbm.edu.lk",
    senderName: "NSBM MathMaster",
    welcomeEmailTemplate: "Welcome to the NSBM MathMaster Inter-School Competition! Your login credentials are: Username: {{username}} Password: {{password}}",
    resultEmailTemplate: "Congratulations on completing the NSBM MathMaster Competition! Your score: {{score}}/{{total}}. Rank: {{rank}}"
  });
  
  const handleSaveGeneral = () => {
    // In a real app, this would be an API call
    toast({
      title: "Settings Saved",
      description: "General settings have been updated successfully.",
      variant: "default",
    });
  };
  
  const handleSaveEmail = () => {
    // In a real app, this would be an API call
    toast({
      title: "Settings Saved",
      description: "Email settings have been updated successfully.",
      variant: "default",
    });
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">System Settings</h2>
      
      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email Templates</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card className="p-6 bg-white rounded-xl shadow-lg">
            <div className="space-y-6">
              <div>
                <Label htmlFor="competition-name">Competition Name</Label>
                <Input 
                  id="competition-name" 
                  value={generalSettings.competitionName}
                  onChange={(e) => setGeneralSettings({...generalSettings, competitionName: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="time-per-question">Time Per Question (seconds)</Label>
                  <Input 
                    id="time-per-question" 
                    type="number" 
                    value={generalSettings.timePerQuestion}
                    onChange={(e) => setGeneralSettings({...generalSettings, timePerQuestion: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="max-questions">Maximum Questions</Label>
                  <Input 
                    id="max-questions" 
                    type="number" 
                    value={generalSettings.maxQuestions}
                    onChange={(e) => setGeneralSettings({...generalSettings, maxQuestions: parseInt(e.target.value)})}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="allow-retake" 
                    checked={generalSettings.allowRetake}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, allowRetake: checked})}
                  />
                  <Label htmlFor="allow-retake">Allow Students to Retake Quiz</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-answers" 
                    checked={generalSettings.showAnswers}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, showAnswers: checked})}
                  />
                  <Label htmlFor="show-answers">Show Correct Answers After Completion</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="show-leaderboard" 
                    checked={generalSettings.showLeaderboard}
                    onCheckedChange={(checked) => setGeneralSettings({...generalSettings, showLeaderboard: checked})}
                  />
                  <Label htmlFor="show-leaderboard">Show Leaderboard to Students</Label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} className="flex items-center">
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="email">
          <Card className="p-6 bg-white rounded-xl shadow-lg">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="sender-email">Sender Email</Label>
                  <Input 
                    id="sender-email" 
                    type="email" 
                    value={emailSettings.senderEmail}
                    onChange={(e) => setEmailSettings({...emailSettings, senderEmail: e.target.value})}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="sender-name">Sender Name</Label>
                  <Input 
                    id="sender-name" 
                    value={emailSettings.senderName}
                    onChange={(e) => setEmailSettings({...emailSettings, senderName: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="welcome-template">Welcome Email Template</Label>
                <Textarea 
                  id="welcome-template" 
                  value={emailSettings.welcomeEmailTemplate}
                  onChange={(e) => setEmailSettings({...emailSettings, welcomeEmailTemplate: e.target.value})}
                  className="mt-1 min-h-24"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: &#123;username&#125;, &#123;password&#125;, &#123;school&#125;
                </p>
              </div>
              
              <div>
                <Label htmlFor="result-template">Result Email Template</Label>
                <Textarea 
                  id="result-template" 
                  value={emailSettings.resultEmailTemplate}
                  onChange={(e) => setEmailSettings({...emailSettings, resultEmailTemplate: e.target.value})}
                  className="mt-1 min-h-24"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: &#123;username&#125;, &#123;score&#125;, &#123;total&#125;, &#123;rank&#125;, &#123;school&#125;
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveEmail} className="flex items-center">
                  <Save className="mr-2 h-4 w-4" />
                  Save Email Settings
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card className="p-6 bg-white rounded-xl shadow-lg">
            <div className="space-y-6">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select defaultValue="light">
                  <SelectTrigger id="theme" className="mt-1">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center mt-1">
                  <div className="w-8 h-8 bg-primary-600 rounded mr-2"></div>
                  <Input id="primary-color" value="#3B82F6" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="logo-url">Logo URL</Label>
                <Input id="logo-url" placeholder="https://example.com/logo.svg" className="mt-1" />
              </div>
              
              <div className="flex justify-end">
                <Button className="flex items-center">
                  <Save className="mr-2 h-4 w-4" />
                  Save Appearance
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup">
          <Card className="p-6 bg-white rounded-xl shadow-lg">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Backup Data</h3>
                <p className="text-gray-600 mb-4">Create a backup of all competition data including users, questions, and results.</p>
                <Button>Create Backup</Button>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Restore Data</h3>
                <p className="text-gray-600 mb-4">Restore from a previous backup file.</p>
                <div className="flex items-center space-x-2">
                  <Input id="backup-file" type="file" />
                  <Button variant="outline">Restore</Button>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-text-gray-800 mb-2">Export Results</h3>
                <p className="text-gray-600 mb-4">Export quiz results in CSV format.</p>
                <Button variant="outline">Export CSV</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
