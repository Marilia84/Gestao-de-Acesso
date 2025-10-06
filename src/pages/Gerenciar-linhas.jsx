import React from "react";
import Navbar from "../components/Navbar";

export default function GerenciarLinhas() {
  

   return (
      <div className="bg-[#E5EDE9] min-h-screen flex items-center gap-4">
        <Navbar />
        <div className="flex flex-1 flex-col justify-center items-center mr-[10px]  ">
          <div className="bg-white/10 shadow-md shadow-white  rounded-[32px] h-[895px] w-[1740px] mb-8 mt-8 p-8">
            <div className="relative mt-2 w-[600px] mb-[35px] ">
              <h1 className="text-3xl font-bold mb-6 text-black">
                Gerenciar Linhas
              </h1>
             
            </div>
           
               
              
          </div>
        </div>
      </div>
    );
}