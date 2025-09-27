import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Palette, RotateCcw } from 'lucide-react';
import { useGradientSettings } from '@/hooks/useGradientSettings';

interface GradientPickerProps {
  onClose?: () => void;
}

export const GradientPicker = ({ onClose }: GradientPickerProps) => {
  const { gradientSettings, updateGradientSettings, resetGradient, applyPreset, presets } = useGradientSettings();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleColorChange = (colorType: 'primary' | 'secondary', color: string) => {
    updateGradientSettings({ [colorType]: color });
  };

  const handleDirectionChange = (direction: number[]) => {
    updateGradientSettings({ direction: direction[0] });
  };

  const previewStyle = {
    background: `linear-gradient(${gradientSettings.direction}deg, ${gradientSettings.primary}, ${gradientSettings.secondary})`,
  };

  return (
    <Card className="w-full max-w-md bg-gradient-card border border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Palette className="h-5 w-5" />
            Gradient Customizer
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? 'Simple' : 'Advanced'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetGradient}
              className="text-xs"
              title="Reset to default"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Gradient Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Preview</Label>
          <div
            className="w-full h-16 rounded-lg border border-border/30 shadow-sm"
            style={previewStyle}
          />
        </div>

        {/* Preset Gradients */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => {
              const isActive = 
                preset.primary === gradientSettings.primary &&
                preset.secondary === gradientSettings.secondary &&
                preset.direction === gradientSettings.direction;
              
              return (
                <Button
                  key={preset.name}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="text-xs h-auto p-2 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-8 h-4 rounded border border-border/30"
                    style={{
                      background: `linear-gradient(${preset.direction}deg, ${preset.primary}, ${preset.secondary})`,
                    }}
                  />
                  <span className="text-xs">{preset.name}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Advanced Controls */}
        {isExpanded && (
          <div className="space-y-4 pt-2 border-t border-border/30">
            {/* Primary Color */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gradientSettings.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-10 h-8 rounded border border-border/30 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {gradientSettings.primary}
                </span>
              </div>
            </div>

            {/* Secondary Color */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Secondary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gradientSettings.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="w-10 h-8 rounded border border-border/30 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {gradientSettings.secondary}
                </span>
              </div>
            </div>

            {/* Direction Slider */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Direction: {gradientSettings.direction}°
              </Label>
              <Slider
                value={[gradientSettings.direction]}
                onValueChange={handleDirectionChange}
                max={360}
                min={0}
                step={15}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0°</span>
                <span>90°</span>
                <span>180°</span>
                <span>270°</span>
                <span>360°</span>
              </div>
            </div>
          </div>
        )}

        {/* Close Button */}
        {onClose && (
          <div className="pt-2">
            <Button
              onClick={onClose}
              className="w-full"
              variant="outline"
            >
              Done
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
