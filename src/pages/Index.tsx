
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Users, GraduationCap, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const stats = [
    { 
      title: "Počet zamestnancov", 
      value: "124", 
      description: "V 8 tímoch", 
      icon: Users, 
      color: "bg-blue-100 text-blue-600"
    },
    { 
      title: "Počet zručností", 
      value: "48", 
      description: "V 5 kategóriách", 
      icon: ClipboardList,
      color: "bg-purple-100 text-purple-600" 
    },
    { 
      title: "Aktívne školenia", 
      value: "12", 
      description: "8 dokončených tento mesiac", 
      icon: GraduationCap,
      color: "bg-green-100 text-green-600" 
    },
    { 
      title: "Medzery v zručnostiach", 
      value: "18", 
      description: "Kritické oblasti na riešenie", 
      icon: BarChart,
      color: "bg-red-100 text-red-600" 
    },
  ];

  const quickLinks = [
    { name: "Zobraziť maticu zručností", path: "/skill-matrix", description: "Prezrite si a vyhodnoťte zručnosti tímu" },
    { name: "Spravovať školenia", path: "/training", description: "Naplánujte a sledujte priebeh školení" },
    { name: "Analýza medzier", path: "/gap-analysis", description: "Identifikujte nedostatky zručností a naplánujte kroky" },
    { name: "Prehľad tímu", path: "/teams", description: "Zobraziť zloženie a schopnosti tímu" },
    { name: "Správa zamestnancov", path: "/employees", description: "Spravujte informácie a údaje o zamestnancoch" },
    { name: "Matica zamestnancov", path: "/employee-matrix", description: "Analýza zručností zamestnancov a vyhľadávanie talentov" },
  ];
  
  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prehľad</h1>
          <p className="text-muted-foreground mt-1">
            Vitajte v aplikácii Matrica zručností – optimalizujte výkonnosť a rozvoj vášho tímu
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className={`rounded-full p-2 ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Rýchle akcie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickLinks.map((link, i) => (
                  <Card key={i} className="bg-accent">
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{link.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                      <Button className="mt-3 w-full" size="sm" asChild>
                        <Link to={link.path}>View</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>O aplikácii Matrica zručností</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Aplikácia Matrica zručností je komplexný nástroj na sledovanie, správu a vizualizáciu zručností zamestnancov vo vašej organizácii.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-accent p-3 rounded-md">
                  <h4 className="font-medium text-sm">Efektivita tímu</h4>
                  <p className="text-sm text-muted-foreground">Zvýšenie o 50%</p>
                </div>
                <div className="bg-accent p-3 rounded-md">
                  <h4 className="font-medium text-sm">Náklady na školenia</h4>
                  <p className="text-sm text-muted-foreground">Zníženie až o 30%</p>
                </div>
                <div className="bg-accent p-3 rounded-md">
                  <h4 className="font-medium text-sm">Udržanie talentov</h4>
                  <p className="text-sm text-muted-foreground">Zvýšenie o 40%</p>
                </div>
                <div className="bg-accent p-3 rounded-md">
                  <h4 className="font-medium text-sm">Personalized Growth</h4>
                  <p className="text-sm text-muted-foreground">Development plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
