import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";

interface CodePreviewProps {
  supervisorCode?: string;
  workerCode?: string;
  stateCode?: string;
  workflowCode?: string;
  completeCode?: string;
}

export default function CodePreview({
  supervisorCode,
  workerCode,
  stateCode,
  workflowCode,
  completeCode,
}: CodePreviewProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  
  const copyToClipboard = async (code: string, tabName: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedTab(tabName);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };
  
  const CodeTab = ({ code, title, tabValue }: { code: string; title: string; tabValue: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(code, tabValue)}
        >
          {copiedTab === tabValue ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-auto">
          <SyntaxHighlighter
            language="python"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: "0 0 var(--radius) var(--radius)",
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </CardContent>
    </Card>
  );
  
  if (!completeCode && !supervisorCode && !workerCode && !stateCode && !workflowCode) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No code generated yet. Complete the form and click "Generate Code".</p>
      </div>
    );
  }
  
  return (
    <Tabs defaultValue="complete" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="complete">Complete</TabsTrigger>
        <TabsTrigger value="supervisor">Supervisor</TabsTrigger>
        <TabsTrigger value="worker">Workers</TabsTrigger>
        <TabsTrigger value="state">State</TabsTrigger>
        <TabsTrigger value="workflow">Workflow</TabsTrigger>
      </TabsList>
      
      {completeCode && (
        <TabsContent value="complete">
          <CodeTab code={completeCode} title="Complete Agent Code" tabValue="complete" />
        </TabsContent>
      )}
      
      {supervisorCode && (
        <TabsContent value="supervisor">
          <CodeTab code={supervisorCode} title="Supervisor Agent" tabValue="supervisor" />
        </TabsContent>
      )}
      
      {workerCode && (
        <TabsContent value="worker">
          <CodeTab code={workerCode} title="Worker Agents" tabValue="worker" />
        </TabsContent>
      )}
      
      {stateCode && (
        <TabsContent value="state">
          <CodeTab code={stateCode} title="State Management" tabValue="state" />
        </TabsContent>
      )}
      
      {workflowCode && (
        <TabsContent value="workflow">
          <CodeTab code={workflowCode} title="Workflow Orchestration" tabValue="workflow" />
        </TabsContent>
      )}
    </Tabs>
  );
}
